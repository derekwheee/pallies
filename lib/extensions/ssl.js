'use strict';

const Toys = require('toys');

module.exports = (server, options) => {

    return Toys.onRequest((request, h) => {

        const { requireSSL } = options;

        if (!requireSSL) {
            return h.continue;
        }

        const redirect = request.headers.hasOwnProperty('x-forwarded-proto')
            ? request.headers['x-forwarded-proto'] === 'http'
            : request.server.info.protocol === 'http';

        const host = request.headers['x-forwarded-host'] || request.url.host;

        if (!redirect) {
            return h.continue;
        }

        return h
            .redirect('https://' + host + (request.url.path || request.url.pathname + request.url.search))
            .takeover()
            .code(301);
    });
};
