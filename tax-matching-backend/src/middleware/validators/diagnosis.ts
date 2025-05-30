import { body, param, query } from 'express-validator';

export const saveResultValidation = [
  body('answers')
    .isObject()
    .withMessage('Answers must be an object')
    .custom((value) => {
      // Check if answers object has at least one answer
      if (Object.keys(value).length === 0) {
        throw new Error('At least one answer is required');
      }
      return true;
    }),
];

export const deleteResultValidation = [
  param('resultId')
    .isUUID()
    .withMessage('Result ID must be a valid UUID'),
];

export const limitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];