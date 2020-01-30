'use strict';

const Toys = require('toys');
const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { email, password } = request.query;
            const { jwt: { useRefreshTokens } } = Toys.options(request);

            const results = await AuthService.login(email, password);

            if (!results.isBoom && useRefreshTokens) {
                h.state('_pallies', results.refreshToken, {
                    // TODO: Make this configurable
                    ttl: 7 * 24 * 60 * 60 * 1000,
                    // TODO: Make this configurable (at least for dev)
                    isSecure: false,
                    isHttpOnly: true
                });
            }

            return new SuccessResult(results);
        }
    }
};
