import * as Joi from 'joi';

export const repoSearchValidation = Joi.object({
  // TODO: find a better way for the messages and remove
  success: Joi.string().optional(),
  fails: Joi.string().optional(),
  // END
  search: Joi.object({
    directory: Joi.string().optional(),
    group: Joi.string().optional(),
    localName: Joi.string().optional(),
    valid: Joi.boolean().optional(),
    remotes: Joi.number().optional(),
    branches: Joi.number().optional(),
  }).optional(),
  sort: Joi.object({
    directory: Joi.string().lowercase().valid('asc', 'desc').optional(),
    group: Joi.string().lowercase().valid('asc', 'desc').optional(),
    localName: Joi.string().lowercase().valid('asc', 'desc').optional(),
    valid: Joi.string().lowercase().valid('asc', 'desc').optional(),
    remotes: Joi.string().lowercase().valid('asc', 'desc').optional(),
    branches: Joi.string().lowercase().valid('asc', 'desc').optional(),
  }).optional(),
});
