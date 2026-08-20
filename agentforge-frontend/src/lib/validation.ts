import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const agentNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters');

export const agentDescriptionSchema = z.string().max(500, 'Description must be at most 500 characters').optional();

export const taskNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(200, 'Name must be at most 200 characters');

export const taskDescriptionSchema = z.string().max(1000, 'Description must be at most 1000 characters').optional();

export const executionIdSchema = z.string().uuid('Invalid execution ID');