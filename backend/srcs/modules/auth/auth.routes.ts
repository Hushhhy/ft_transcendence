/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   auth.routes.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 16:35:55 by pgrellie          #+#    #+#             */
/*   Updated: 2026/04/22 19:44:00 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Router } from 'express';
// import rateLimit, { ipKeyGenerator } from 'express-rate-limit'; ALEXIS
import rateLimit from 'express-rate-limit';
import authController from './auth.controller';

const authRouter = Router();

// Rate limiting moins strict pour verify et forgot password
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/signup
 * Créer un nouveau compte
 */
// authRouter.post('/signup', authLimiter, (req, res, next) => ALEXIS
authRouter.post('/signup', (req, res, next) =>
  authController.signUp(req, res, next)
);

/**
 * POST /api/auth/login
 * Se connecter
 */
// authRouter.post('/login', authLimiter, (req, res, next) => ALEXIS
authRouter.post('/login', (req, res, next) =>
  authController.login(req, res, next)
);

/**
 * POST /api/auth/verify-email
 * Vérifier l'email
 */
authRouter.post('/verify-email', generalLimiter, (req, res, next) =>
  authController.verifyEmail(req, res, next)
);

/**
 * POST /api/auth/forgot-password
 * Demander un reset de password
 */
authRouter.post('/forgot-password', generalLimiter, (req, res, next) =>
  authController.forgotPassword(req, res, next)
);

/**
 * POST /api/auth/reset-password
 * Réinitialiser le password via token
 */
authRouter.post('/reset-password', generalLimiter, (req, res, next) =>
  authController.resetPassword(req, res, next)
);

export default authRouter;
