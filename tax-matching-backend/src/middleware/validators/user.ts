import { body, param, query } from 'express-validator';

export const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('companyName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Company name must be between 1 and 100 characters'),
  
  body('phoneNumber')
    .optional()
    .matches(/^[\d\-\+\(\)\s]+$/)
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be valid'),
  
  body('prefecture')
    .optional()
    .isLength({ min: 1, max: 20 })
    .trim()
    .withMessage('Prefecture must be between 1 and 20 characters'),
  
  body('city')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('City must be between 1 and 50 characters'),
  
  body('address')
    .optional()
    .isLength({ min: 1, max: 200 })
    .trim()
    .withMessage('Address must be between 1 and 200 characters'),
  
  body('businessType')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('Business type must be between 1 and 50 characters'),
  
  body('annualRevenue')
    .optional()
    .isNumeric()
    .withMessage('Annual revenue must be a number'),
  
  body('employeeCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Employee count must be a non-negative integer'),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL'),
];

export const updateTaxAccountantValidation = [
  body('licenseNumber')
    .optional()
    .isLength({ min: 1, max: 50 })
    .trim()
    .withMessage('License number must be between 1 and 50 characters'),
  
  body('officeName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('Office name must be between 1 and 100 characters'),
  
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Years of experience must be between 0 and 60'),
  
  body('bio')
    .optional()
    .isLength({ max: 2000 })
    .trim()
    .withMessage('Bio must be less than 2000 characters'),
  
  body('specialtiesJson')
    .optional()
    .isArray()
    .withMessage('Specialties must be an array'),
  
  body('certificationsJson')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  
  body('isAcceptingClients')
    .optional()
    .isBoolean()
    .withMessage('Is accepting clients must be a boolean'),
];

export const addSpecialtyValidation = [
  body('specialtyId')
    .isUUID()
    .withMessage('Specialty ID must be a valid UUID'),
  
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Years of experience must be between 0 and 60'),
];

export const removeSpecialtyValidation = [
  param('specialtyId')
    .isUUID()
    .withMessage('Specialty ID must be a valid UUID'),
];

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const notificationValidation = [
  param('notificationId')
    .isUUID()
    .withMessage('Notification ID must be a valid UUID'),
];