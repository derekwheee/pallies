'use strict';

module.exports = (server, options) => ({
    scheme: 'jwt',
    options: {
        key: options.tokenSecret,
        urlKey: false,
        cookieKey: false,
        tokenType: 'Bearer',
        verifyOptions: { algorithms: ['HS256'] },
        validate: async (decoded, request) => {

            const AuthService = request.server.services().authService;

            return await AuthService.validate(decoded, request.auth);

        }
    }
});
