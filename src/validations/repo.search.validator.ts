import * as Joi from 'joi';

export const repoSearchValidation = Joi.object({
  search: Joi.object({
    folderKey: Joi.string().optional(),
    directory: Joi.string().optional(),
    group: Joi.string().optional(),
    localName: Joi.string().optional(),
    valid: Joi.boolean().optional(),
    remotes: Joi.number().optional(),
    branches: Joi.number().optional(),
  }).optional(),
  sort: Joi.object({
    folderKey: Joi.string().lowercase().valid('asc', 'desc').optional(),
    directory: Joi.string().lowercase().valid('asc', 'desc').optional(),
    group: Joi.string().lowercase().valid('asc', 'desc').optional(),
    localName: Joi.string().lowercase().valid('asc', 'desc').optional(),
    valid: Joi.string().lowercase().valid('asc', 'desc').optional(),
    remotes: Joi.string().lowercase().valid('asc', 'desc').optional(),
    branches: Joi.string().lowercase().valid('asc', 'desc').optional(),
  }).optional(),
});
