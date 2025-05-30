import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '@/utils/config';
import logger from '@/utils/logger';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single profile image upload
export const uploadProfileImage = upload.single('profileImage');

// Error handler for multer errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.',
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "profileImage" as field name.',
      });
    }
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed (PNG, JPG, JPEG, GIF, WebP).',
    });
  }

  logger.error('Upload error', { error: error.message });
  return res.status(500).json({
    success: false,
    message: 'Upload failed',
  });
};

// Utility function to clean up old profile images
export const cleanupOldProfileImage = async (oldImagePath: string) => {
  if (oldImagePath && fs.existsSync(oldImagePath)) {
    try {
      fs.unlinkSync(oldImagePath);
      logger.info('Old profile image deleted', { path: oldImagePath });
    } catch (error) {
      logger.error('Failed to delete old profile image', { 
        path: oldImagePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};