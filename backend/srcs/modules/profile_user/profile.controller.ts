import { Request, Response, NextFunction } from 'express';
import multer, { type FileFilterCallback, type MulterFile } from 'multer';
import path from 'path';
import { UpdateProfileSchema } from './profile.dto';
import ProfileService from './profile.service';

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (_req: unknown, _file: MulterFile, cb: (error: Error | null, destination?: string) => void) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (_req: unknown, file: MulterFile, cb: (error: Error | null, filename?: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (_req: unknown, file: MulterFile, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  }
});

class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const profile = await ProfileService.getProfile(userId);
      res.status(200).json({ status: 'success', message: 'Profile fetched successfully', data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const updateData: { username?: string; avatarUrl?: string } = {};

      // Handle text fields
      if (req.body.username) {
        updateData.username = req.body.username;
      }

      // Handle file upload
      if (req.file) {
        // Create URL path for the uploaded file
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        updateData.avatarUrl = avatarUrl;
      }

      // Validate that at least one field is provided
      if (!updateData.username && !updateData.avatarUrl) {
        res.status(400).json({
          status: 'error',
          message: 'At least one field must be provided to update the profile'
        });
        return;
      }

      // Validate username if provided
      if (updateData.username) {
        const usernameValidation = UpdateProfileSchema.shape.username.safeParse(updateData.username);
        if (!usernameValidation.success) {
          res.status(400).json({
            status: 'error',
            message: usernameValidation.error.issues[0].message
          });
          return;
        }
      }

      const updatedProfile = await ProfileService.updateProfile(userId, updateData);

      res.status(200).json({ status: 'success', message: 'Profile updated successfully', data: updatedProfile });
    } catch (error) {
      next(error);
    }
  }

  // Middleware for handling avatar upload
  uploadAvatar = upload.single('avatar');

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { query, limit } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          status: 'error',
          message: 'Search query is required',
        });
        return;
      }

      const limitNumber = limit ? Math.min(parseInt(limit as string), 50) : 10; // Max 50 results

      const results = await ProfileService.searchUsers(query, userId, limitNumber);

      res.status(200).json({
        status: 'success',
        message: 'Users found successfully',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlackjackStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { limit } = req.query;
      const limitNumber = limit ? Math.min(Math.max(parseInt(limit as string, 10) || 10, 1), 50) : 10;
      const stats = await ProfileService.getBlackjackStats(userId, limitNumber);

      res.status(200).json({
        status: 'success',
        message: 'Blackjack stats fetched successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfileController();
