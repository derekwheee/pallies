'use strict';

const Joi = require('joi');
const Pallie = require('../../models/pallie');

module.exports = {
    method: 'POST',
    path: '/invite',
    options: {
        auth: 'jwt',
        validate: {
            payload: Joi.object({
                user: Pallie.joiSchema,
                force: Joi.bool().optional()
            })
        },
        handler: async (request, h) => {

            const { authService } = h.services();
            const { user, force } = request.payload;

            const results = await authService.invite(user, force);

            return results;
        }
    }
};
