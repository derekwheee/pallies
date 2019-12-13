'use strict';

module.exports = {
    method: 'POST',
    path: '/register',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { name, email, password } = request.payload;

            return await AuthService.register(null, name, email, password);
        }
    }
};
