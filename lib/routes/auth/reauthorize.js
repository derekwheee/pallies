'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { _pallies } = request.state;

            const results = await AuthService.reauthorize(_pallies);

            if (!results.isBoom) {
                h.state('_pallies', results.refreshToken, {
                    // TODO: Make this configurable
                    ttl: 7 * 24 * 60 * 60 * 1000,
                    // TODO: Make this configurable (at least for dev)
                    isSecure: false,
                    isHttpOnly: true
                });
            }

            return new SuccessResult(results.accessToken);
        }
    }
};
