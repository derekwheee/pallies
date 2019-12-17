'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'POST',
    path: '/resetpassword',
    options: {
        auth: {
            strategy: 'jwt',
            mode: 'optional'
        },
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { oldPassword, userHash, forgotPasswordToken, newPassword } = request.payload;

            const results = await AuthService.resetPassword(request, oldPassword, userHash, forgotPasswordToken, newPassword);

            return new SuccessResult(results);
        }
    }
};
