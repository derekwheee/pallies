'use strict';

const Boom = require('@hapi/boom');
const Toys = require('toys');
const RefreshToken = require('../../models/refreshToken');

module.exports = [{
    // This method should be used if the client is capable of managing cookies
    method: 'GET',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const { authService, tokenService } = h.services();
            const { isDev, jwt: { refreshTokenLifespan } } = Toys.options(request);
            const { _pallies } = request.state;

            if (!_pallies) {
                return Boom.badRequest();
            }

            const results = await authService.reauthorize(_pallies);

            if (!results.isBoom) {
                h.state('_pallies', results.refreshToken, {
                    ttl: refreshTokenLifespan * 1000,
                    isSecure: !isDev,
                    isHttpOnly: true
                });
            }

            return tokenService.present(results);
        }
    }
},
{
    // This method should only be used if the client is not capable of managing cookies
    method: 'POST',
    path: '/reauthorize',
    options: {
        validate: {
            payload: {
                token: RefreshToken.field('token')
            }
        },
        handler: async (request, h) => {

            const { authService, tokenService } = h.services();
            const { token } = request.payload;

            const results = await authService.reauthorize(token);

            return tokenService.present(results);
        }
    }
}];
