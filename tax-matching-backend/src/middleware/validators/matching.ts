import { param, body, query } from 'express-validator';

export const getRecommendationsValidation = [
  param('diagnosisResultId')
    .isUUID()
    .withMessage('Diagnosis result ID must be a valid UUID'),
];

export const regenerateMatchesValidation = [
  param('diagnosisResultId')
    .isUUID()
    .withMessage('Diagnosis result ID must be a valid UUID'),
  
  body('criteria')
    .optional()
    .isObject()
    .withMessage('Criteria must be an object'),
  
  body('criteria.businessType')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Business type must be a string between 1 and 50 characters'),
  
  body('criteria.budget')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Budget must be a non-negative integer'),
  
  body('criteria.location')
    .optional()
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Location must be a string between 1 and 20 characters'),
  
  body('criteria.needs')
    .optional()
    .isArray()
    .withMessage('Needs must be an array'),
  
  body('criteria.needs.*')
    .optional()
    .isString()
    .withMessage('Each need must be a string'),
  
  body('criteria.frequency')
    .optional()
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Frequency must be a string between 1 and 20 characters'),
];

export const getRecommendedTaxAccountantsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  
  query('includeMatchScore')
    .optional()
    .isBoolean()
    .withMessage('Include match score must be a boolean'),
];

export const getMatchingStatsValidation = [
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid ISO 8601 date'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid ISO 8601 date'),
];