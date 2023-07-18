'use strict';

const Joi = require('joi');

module.exports = {
    method: 'POST',
    path: '/login',
    options: {
        validate: {
            payload: Joi.object({
                username: Joi.string().required(),
                password: Joi.string().required()
            })
        },
        handler: async (request, h) => {

            const { authService, tokenService } = h.services();
            const { username, password } = request.payload;

            const results = await authService.login(username, password);

            if (!results.isBoom) {
                h.state('_pallies', results.refreshToken);
            }

            return tokenService.present(results);
        }
    }
};
