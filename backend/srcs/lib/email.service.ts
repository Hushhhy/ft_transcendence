import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService
{
  private createTransporter(): nodemailer.Transporter
  {
    return (nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      } : undefined,
    }));
  }

  async sendVerificationEmail(email: string, token: string): Promise<void>
  {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <h2>Bienvenue sur Transcendence!</h2>
      <p>Cliquez sur le lien pour vérifier votre email:</p>
      <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Vérifier mon email
      </a>
      <p>Ou copiez ce lien: ${verificationUrl}</p>
      <p>Ce lien expire dans 24 heures.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Vérifiez votre email - Transcendence',
      html,
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void>
  {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Cliquez sur le lien pour réinitialiser votre mot de passe:</p>
      <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Réinitialiser mon mot de passe
      </a>
      <p>Ce lien expire dans 1 heure.</p>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Réinitialisation de mot de passe - Transcendence',
      html,
    });
  }

  private async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const info = await this.createTransporter().sendMail({
        from: process.env.SMTP_FROM || 'noreply@transcendence.local',
        ...options,
      });

      logger.info(`Email sent: ${info.messageId}`);
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  async verifyConnection(): Promise<boolean>
  {
    try {
      await this.createTransporter().verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error) {
      logger.warn('Email service connection failed', error);
      return false;
    }
  }
}

export default new EmailService();
