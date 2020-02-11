'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'POST',
    path: '/invite',
    options: {
        auth: 'jwt',
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { name, username, force } = request.payload;

            const results = await AuthService.invite(name, username, force);

            return new SuccessResult(results);
        }
    }
};
