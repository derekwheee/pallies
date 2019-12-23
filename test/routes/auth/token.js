'use strict';

// Load modules

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

// Test shortcuts

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Token', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('get user token', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `token-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const response = await internals.server.inject({
            method: 'get',
            url: `/token?email=token-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result.data).to.be.a.object();
        expect('access_token' in response.result.data).to.be.true();
        expect('refresh_token' in response.result.data).to.be.true();
        expect('token_type' in response.result.data).to.be.true();
    });

    after(async () => {

        const user = await internals.server.services().userService.getByEmail(`token-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByEmail(`token-${Constants.TEST_USER_EMAIL}`);
    });
});
