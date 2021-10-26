'use strict';

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { identifier, password } = request.query;

            return await AuthService.login(identifier, password);
        }
    }
};
