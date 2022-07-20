'use strict';

module.exports = {
    method: 'POST',
    path: '/forgotpassword',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { username } = request.payload;

            await AuthService.forgotPassword(username);

            return h.response().code(204);
        }
    }
};
