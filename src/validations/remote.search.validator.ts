import * as Joi from 'joi';

export const remoteSearchValidation = Joi.object({
  search: Joi.object({
    folderKey: Joi.string().optional(),
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
    folderKey: Joi.string().lowercase().valid('asc', 'desc').optional(),
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
