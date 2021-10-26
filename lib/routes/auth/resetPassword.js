'use strict';

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

            return await AuthService.resetPassword(
                request.auth.credentials,
                oldPassword,
                userHash,
                forgotPasswordToken,
                newPassword
            );
        }
    }
};
