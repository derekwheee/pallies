'use strict';

module.exports = {
    method: 'POST',
    path: '/invite',
    options: {
        auth: 'jwt',
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { name, email, force } = request.payload;

            return await AuthService.invite(request, null, name, email, force);
        }
    }
};
