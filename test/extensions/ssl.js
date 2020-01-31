'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');

const { describe, it, before } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('SSL', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('no redirect', async () => {

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf'
        });

        expect(response.statusCode).to.equal(200);
    });

    it('enforce redirect', async () => {

        internals.server.registrations.pallies.options.requireSSL = true;

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf'
        });

        expect(response.statusCode).to.equal(301);
        expect(response.headers.location).to.equal('https://localhost:3000/csrf');
    });

    it('proxy redirect', async () => {

        internals.server.registrations.pallies.options.requireSSL = true;

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf',
            headers: {
                'x-forwarded-proto': 'http',
                'x-forwarded-host': 'localhost:3000'
            }
        });

        expect(response.statusCode).to.equal(301);
        expect(response.headers.location).to.equal('https://localhost:3000/csrf');
    });

    it('proxy no redirect', async () => {

        internals.server.registrations.pallies.options.requireSSL = true;

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf',
            headers: {
                'x-forwarded-proto': 'https',
                'x-forwarded-host': 'localhost:3000'
            }
        });

        expect(response.statusCode).to.equal(200);
    });

    it('verify redirect path', async () => {

        internals.server.registrations.pallies.options.requireSSL = true;

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf',
            headers: {
                'x-forwarded-proto': 'http',
                'x-forwarded-host': 'localhost:3000'
            }
        });

        expect(response.statusCode).to.equal(301);
        expect(response.headers.location).to.equal('https://localhost:3000/csrf');
    });

    it('verify redirect querystring path', async () => {

        internals.server.registrations.pallies.options.requireSSL = true;

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf?test=test',
            headers: {
                'x-forwarded-proto': 'http',
                'x-forwarded-host': 'localhost:3000'
            }
        });

        expect(response.statusCode).to.equal(301);
        expect(response.headers.location).to.equal('https://localhost:3000/csrf?test=test');
    });
});
