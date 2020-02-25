'use strict';

const Joi = require('@hapi/joi');
const Toys = require('toys');
const SuccessResult = require('../../dto/successResult');

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

            const AuthService = h.services().authService;
            const { username, password } = request.payload;
            const { isDev, jwt: { useRefreshTokens, refreshTokenLifespan } } = Toys.options(request);

            const results = await AuthService.login(username, password);

            if (!results.isBoom && useRefreshTokens) {
                h.state('_pallies', results.refreshToken, {
                    ttl: refreshTokenLifespan * 1000,
                    isSecure: !isDev,
                    isHttpOnly: true
                });
            }

            return new SuccessResult(results);
        }
    }
};
