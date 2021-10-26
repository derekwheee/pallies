'use strict';

const Toys = require('toys');

module.exports = {
    method: 'GET',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { isDev, jwt: { refreshTokenLifespan } } = Toys.options(request);
            const { _pallies } = request.state;

            const results = await AuthService.reauthorize(_pallies);

            if (!results.isBoom) {
                h.state('_pallies', results.refreshToken, {
                    ttl: refreshTokenLifespan * 1000,
                    isSecure: !isDev,
                    isHttpOnly: true
                });
            }

            return results.accessToken;
        }
    }
};
