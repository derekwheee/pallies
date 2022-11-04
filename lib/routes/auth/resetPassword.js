'use strict';

module.exports = {
    method: 'POST',
    path: '/reset-password',
    options: {
        auth: {
            strategy: 'jwt',
            mode: 'optional'
        },
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { oldPassword, userHash, forgotPasswordToken, newPassword } = request.payload;

            await AuthService.resetPassword(request.auth.credentials, oldPassword, userHash, forgotPasswordToken, newPassword);

            return h.response().code(204);
        }
    }
};
