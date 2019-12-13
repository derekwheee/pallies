'use strict';

module.exports = {
    method: 'GET',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const AuthService = h.services().authService;
            const { refresh_token } = request.query;

            return await AuthService.reauthorize(refresh_token);
        }
    }
};
