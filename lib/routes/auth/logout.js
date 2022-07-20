'use strict';

module.exports = {
    method: 'POST',
    path: '/logout',
    options: {
        auth: {
            strategy: 'jwt'
        },
        handler: async (request, h) => {

            const AuthService = h.services().authService;

            await AuthService.logout(request.auth.credentials);

            return h.response().code(204);
        }
    }
};
