'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');

const { describe, it, before } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('CSRF', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('get CSRF token', async () => {

        const response = await internals.server.inject({
            method: 'get',
            url: '/csrf'
        });

        const crumb = response.headers['set-cookie'][0].match(/=([^;]+)/)[1];

        expect(response.statusCode).to.equal(200);
        expect(response.result.data).to.be.a.string();
        expect(response.result.data).to.equal(crumb);
    });
});
