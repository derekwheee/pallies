'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { refresh_token } = request.query;

            const results = await AuthService.reauthorize(refresh_token);

            return SuccessResult(results);
        }
    }
};
