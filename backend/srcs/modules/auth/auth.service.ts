import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import emailService from '../../lib/email.service';
import logger from '../../lib/logger';
import { SignUpDTO, LoginDTO, AuthResponseDTO } from './auth.dto';
import jwt from 'jsonwebtoken';

type SanitizableAuthUser = AuthResponseDTO & {
  password: string;
  emailVerificationToken: string | null;
  passwordResetToken: string | null;
};

const DEFAULT_AVATAR_URL = '/profile.svg';

export class AuthService
{
  async signUp(data: SignUpDTO): Promise<AuthResponseDTO>
  {
    try {
      return await prisma.$transaction(async (tx) => {
        // Vérifier email unique
        const existingEmail = await tx.user.findUnique({
          where: { email: data.email },
        });
        if (existingEmail) {
          logger.warn(`Sign up attempt with existing email: ${data.email}`);
          throw new Error('Email already registered');
        }
        // Vérifier username unique
        const existingUsername = await tx.user.findUnique({
          where: { username: data.username },
        });
        if (existingUsername) {
          logger.warn(`Sign up attempt with existing username: ${data.username}`);
          throw new Error('Username already taken');
        }
        // Hasher le password avec salt rounds = 12 (plus sécurisé)
        const hashedPassword = await bcrypt.hash(data.password, 12);
        // Générer token de vérification email
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        // Créer l'utilisateur
        const normalizedAvatarUrl = data.avatarUrl && data.avatarUrl.trim().length > 0
          ? data.avatarUrl.trim()
          : DEFAULT_AVATAR_URL;
        const user = await tx.user.create({
          data: {
            email: data.email,
            username: data.username,
            birthDate: data.birthDate,
            password: hashedPassword,
            avatarUrl: normalizedAvatarUrl,
            emailVerificationToken,
            emailVerificationExpiry,
            verified: false,
          },
        });
        logger.info(`User created successfully: ${user.id} (${user.email})`);
        // Envoyer email de vérification (async, non-blocking)
        emailService.sendVerificationEmail(user.email, emailVerificationToken)
          .catch(err => logger.error(`Failed to send verification email: ${err.message}`));
        return (this.sanitizeUser(user));
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Sign up error: ${error.message}`);
        throw error;
      }
      throw new Error('Sign up failed');
    }
  }

  async login(data: LoginDTO): Promise<AuthResponseDTO & { token: string }>
  {
    try {
      const user = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${data.email}`);
        throw new Error('Invalid email or password');
      }
      // Comparer les passwords
      const passwordMatch = await bcrypt.compare(data.password, user.password);
      if (!passwordMatch) {
        logger.warn(`Failed login attempt for user: ${user.id}`);
        throw new Error('Invalid email or password');
      }
      if (!user.verified) {
        logger.warn(`Login attempt by unverified user: ${user.id}`);
        throw new Error('Please verify your email first');
      }
      logger.info(`User logged in: ${user.id}`);
      // Générer JWT token (à implémenter)
      const secret = process.env.JWT_SECRET;
      if (!secret)
        throw new Error('JWT secret is not configured');
      const parsedExpiresIn = Number(process.env.JWT_EXPIRES_IN);
      const expiresIn = Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0
        ? parsedExpiresIn
        : 3600;
      const token = jwt.sign(
        {userId: user.id},
        secret, 
        { expiresIn }
      );
      return {
        ...this.sanitizeUser(user),
        token,
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Login error: ${error.message}`);
        throw error;
      }
      throw new Error('Login failed');
    }
  }


  async verifyEmail(token: string): Promise<AuthResponseDTO>
  {
    try {
      const user = await prisma.user.findFirst({
        where: {
          emailVerificationToken: token,
          emailVerificationExpiry: {
            gt: new Date(),
          },
        },
      });
      if (!user) {
        logger.warn(`Invalid or expired email verification token`);
        throw new Error('Invalid or expired verification token');
      }
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          verified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
      logger.info(`User email verified: ${updatedUser.id}`);
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Email verification error: ${error.message}`);
        throw error;
      }
      throw new Error('Email verification failed');
    }
  }

  async requestPasswordReset(email: string): Promise<void>
  {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        // Ne pas révéler s'il existe ou non pour des raisons de sécurité
        logger.info(`Password reset request for non-existent email: ${email}`);
        return;
      }
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetTokenExpiry,
        },
      });
      logger.info(`Password reset token generated for user: ${user.id}`);
      // Envoyer email (async)
      emailService.sendResetPasswordEmail(user.email, resetToken)
        .catch(err => logger.error(`Failed to send reset email: ${err.message}`));
    } catch (error) {
      logger.error(`Password reset request error: ${error}`);
      throw new Error('Failed to process password reset request');
    }
  }

  async resetPasswordWithToken(token: string, newPassword: string, confirmPassword: string): Promise<void>
  {
    try {
      const normalizedToken = token.trim();
      if (!normalizedToken) {
        throw new Error('Invalid reset token');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      const user = await prisma.user.findFirst({
        where: {
          passwordResetToken: normalizedToken,
          passwordResetExpiry: {
            gt: new Date(),
          },
        },
      });
      if (!user) {
        logger.warn('Invalid or expired password reset token');
        throw new Error('Invalid or expired reset token');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });
      logger.info(`Password reset successful for user: ${user.id}`);
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Password reset error: ${error.message}`);
        throw error;
      }
      throw new Error('Failed to reset password');
    }
  }
  private sanitizeUser(user: SanitizableAuthUser): AuthResponseDTO {
    const { password, emailVerificationToken, passwordResetToken, ...sanitized } = user;
    return sanitized;
  }
}

export default new AuthService();
