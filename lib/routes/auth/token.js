'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { username, password } = request.query;

            const results = await AuthService.login(username, password);

            return new SuccessResult(results);
        }
    }
};
