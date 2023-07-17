'use strict';

module.exports = (server, { isDev, refreshToken = {} }) => ({
    name: refreshToken.name ?? '_pallies',
    options: {
        ttl: refreshToken.lifespan * 1000,
        isSecure: !isDev,
        isHttpOnly: true,
        path: refreshToken.path ?? '/reauthorize'
    }
});