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

            const results = await AuthService.invite(request, name, email, force);

            return SuccessResult(results);
        }
    }
};
