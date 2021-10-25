'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { identifier, password } = request.query;

            const results = await AuthService.login(identifier, password);

            return new SuccessResult(results);
        }
    }
};
