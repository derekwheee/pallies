'use strict';

module.exports = {
    method: 'GET',
    path: '/token',
    options: {
        handler: async (request, h) => {

            const { authService, tokenService } = h.services();
            const { username, password } = request.query;

            const results = await authService.login(username, password);

            return tokenService.present(results);
        }
    }
};
