'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'POST',
    path: '/register',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { name, username, password } = request.payload;

            const results = await AuthService.register(name, username, password);

            return new SuccessResult(results);
        }
    }
};
