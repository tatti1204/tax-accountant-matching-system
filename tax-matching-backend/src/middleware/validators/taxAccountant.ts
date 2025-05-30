import { query, param } from 'express-validator';

export const taxAccountantListValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['rating', 'experience', 'price', 'reviews'])
    .withMessage('Sort by must be one of: rating, experience, price, reviews'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min price must be a non-negative integer'),
  
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max price must be a non-negative integer'),
  
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Min rating must be between 0 and 5'),
  
  query('minExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min experience must be a non-negative integer'),
  
  query('isAcceptingClients')
    .optional()
    .isBoolean()
    .withMessage('Is accepting clients must be a boolean'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('specialties')
    .optional()
    .custom((value) => {
      // Allow single string or array of strings
      if (typeof value === 'string') return true;
      if (Array.isArray(value) && value.every(item => typeof item === 'string')) return true;
      throw new Error('Specialties must be a string or array of strings');
    }),
  
  query('prefecture')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Prefecture must be between 1 and 20 characters'),
];

export const taxAccountantByIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Tax accountant ID must be a valid UUID'),
];

export const searchValidation = [
  query('q')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query is required and must be between 1 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

export const popularValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
];