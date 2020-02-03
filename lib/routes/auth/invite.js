'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'POST',
    path: '/invite',
    options: {
        auth: 'jwt',
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { name, email, force } = request.payload;

            const results = await AuthService.invite(name, email, force);

            return new SuccessResult(results);
        }
    }
};
