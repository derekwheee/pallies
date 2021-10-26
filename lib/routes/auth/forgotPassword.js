'use strict';

module.exports = {
    method: 'POST',
    path: '/forgotpassword',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { identifier } = request.payload;

            await AuthService.forgotPassword(identifier);

            return h.response().code(200);
        }
    }
};
