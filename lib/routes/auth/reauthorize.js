'use strict';

module.exports = {
    method: 'POST',
    path: '/reauthorize',
    options: {
        handler: async (request, h) => {

            const tokenService = h.services().authService;

            const { refreshToken } = request.payload;

            const results = await tokenService.validateRefreshToken(refreshToken);

            return results;
        }
    }
};
