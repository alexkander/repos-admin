import * as Joi from 'joi';

export const remoteSearchValidation = Joi.object({
  // TODO: find a better way for the messages and remove
  success: Joi.string().optional(),
  fails: Joi.string().optional(),
  // END
  search: Joi.object({
    directory: Joi.string().optional(),
    name: Joi.string().optional(),
    rare: Joi.string().optional(),
    targetHost: Joi.string().optional(),
    targetGroup: Joi.string().optional(),
    targetName: Joi.string().optional(),
    url: Joi.string().optional(),
    urlType: Joi.string().optional(),
    fetchStatus: Joi.string().optional(),
  }).optional(),
  sort: Joi.object({
    directory: Joi.string().lowercase().valid('asc', 'desc').optional(),
    name: Joi.string().lowercase().valid('asc', 'desc').optional(),
    rare: Joi.string().lowercase().valid('asc', 'desc').optional(),
    targetHost: Joi.string().lowercase().valid('asc', 'desc').optional(),
    targetGroup: Joi.string().lowercase().valid('asc', 'desc').optional(),
    targetName: Joi.string().lowercase().valid('asc', 'desc').optional(),
    url: Joi.string().lowercase().valid('asc', 'desc').optional(),
    urlType: Joi.string().lowercase().valid('asc', 'desc').optional(),
    fetchStatus: Joi.string().lowercase().valid('asc', 'desc').optional(),
  }).optional(),
});
