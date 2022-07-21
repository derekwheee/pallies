'use strict';

const Joi = require('joi');
const Toys = require('toys');

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
            const { isDev, jwt: { refreshTokenLifespan } } = Toys.options(request);

            const results = await authService.login(username, password);

            if (!results.isBoom) {
                h.state('_pallies', results.refreshToken, {
                    ttl: refreshTokenLifespan * 1000,
                    isSecure: !isDev,
                    isHttpOnly: true,
                    path: '/reauthorize'
                });
            }

            return tokenService.present(results);
        }
    }
};
