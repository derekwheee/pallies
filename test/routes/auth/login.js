'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Token', () => {

    beforeEach(async () => {

        internals.server = await Server.deployment();
    });

    it('get user token', async () => {

        const authService = internals.server.services().authService;

        await authService.register({ identifier: `token-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const response = await internals.server.inject({
            method: 'post',
            url: '/login',
            payload: {
                identifier: `token-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(response.result).to.be.a.object();
        expect('accessToken' in response.result).to.be.true();
    });

    afterEach(async () => {

        const user = await internals.server.services().userService.getByIdentifier(`token-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByIdentifier(`token-${Constants.TEST_USER_EMAIL}`);
    });
});
