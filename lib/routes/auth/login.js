'use strict';

const Joi = require('joi');
const Toys = require('toys');
const SuccessResult = require('../../dto/successResult');

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
            const { isDev, jwt: { useRefreshTokens, refreshTokenLifespan } } = Toys.options(request);

            const results = await AuthService.login(identifier, password);

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
