'use strict';

module.exports = (server, options) => ({
    scheme: 'jwt',
    options: {
        keys: {
            key: options.tokenSecret,
            algorithms: ['HS256']
        },
        verify: {
            aud: false,
            iss: options.jwt.issuer,
            sub: false
        },
        httpAuthScheme: 'Bearer',
        validate: false
    }
});
