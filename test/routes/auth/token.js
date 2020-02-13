'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Token', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('get user token', async () => {

        const authService = internals.server.services().authService;

        await authService.register({ name: Constants.TEST_USER_NAME, username: `token-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const response = await internals.server.inject({
            method: 'get',
            url: `/token?username=token-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result.data).to.be.a.object();
        expect('accessToken' in response.result.data).to.be.true();
    });

    after(async () => {

        const user = await internals.server.services().userService.getByUsername(`token-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByUsername(`token-${Constants.TEST_USER_EMAIL}`);
    });
});
