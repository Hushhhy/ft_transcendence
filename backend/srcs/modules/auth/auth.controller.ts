/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.controller.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:35:47 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/08 17:41:03 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Request, Response, NextFunction } from 'express';
import { SignUpSchema, LoginSchema, SuccessResponse, ErrorResponse } from './auth.dto';
import authService from './auth.service';
import logger from '../../lib/logger';
import { z } from 'zod';

export class AuthController {
  /**
   * POST /api/auth/signup
   */
  async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Valider avec Zod
      const validatedData = SignUpSchema.parse(req.body);

      const user = await authService.signUp(validatedData);

      const response: SuccessResponse<typeof user> = {
        status: 'success',
        message: 'User created successfully. Please verify your email.',
        data: user,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = LoginSchema.parse(req.body);
      const user = await authService.login(validatedData);

      const response: SuccessResponse<typeof user> = {
        status: 'success',
        message: 'Login successful',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        const errorResponse: ErrorResponse = {
          status: 'error',
          message: 'Verification token is required',
        };
        res.status(400).json(errorResponse);
        return;
      }

      const user = await authService.verifyEmail(token);

      const response: SuccessResponse<typeof user> = {
        status: 'success',
        message: 'Email verified successfully',
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        const errorResponse: ErrorResponse = {
          status: 'error',
          message: 'Email is required',
        };
        res.status(400).json(errorResponse);
        return;
      }

      await authService.requestPasswordReset(email);

      const response: SuccessResponse<null> = {
        status: 'success',
        message: 'If an account exists with this email, a reset link will be sent',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
        const errorResponse: ErrorResponse = {
          status: 'error',
          message: 'Token, newPassword and confirmPassword are required',
        };
        res.status(400).json(errorResponse);
        return;
      }

      await authService.resetPasswordWithToken(String(token), String(newPassword), String(confirmPassword));

      const response: SuccessResponse<null> = {
        status: 'success',
        message: 'Password reset successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
