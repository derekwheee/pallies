'use strict';

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { email, password } = request.query;

            return await AuthService.login(email, password);
        }
    }
};
