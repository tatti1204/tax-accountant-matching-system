import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { ApiResponse } from '../types';

const router = Router();

// Example GET endpoint
router.get('/example', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    status: 'success',
    message: 'This is an example endpoint',
    data: {
      timestamp: new Date().toISOString(),
      example: true
    }
  };
  res.json(response);
});

// Example POST endpoint with validation
router.post('/example',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('value').isNumeric().withMessage('Value must be a number'),
    handleValidationErrors
  ],
  (req: Request, res: Response) => {
    const { name, value } = req.body;
    
    const response: ApiResponse = {
      status: 'success',
      message: 'Data received successfully',
      data: {
        name,
        value: Number(value),
        processed: true
      }
    };
    
    res.status(201).json(response);
  }
);

export default router;