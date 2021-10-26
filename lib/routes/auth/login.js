'use strict';

const Joi = require('joi');

module.exports = {
    method: 'POST',
    path: '/login',
    options: {
        validate: {
            payload: Joi.object({
                identifier: Joi.string().required(),
                password: Joi.string().required()
            })
        },
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { identifier, password } = request.payload;

            const results = await AuthService.login(identifier, password);

            return results;
        }
    }
};
