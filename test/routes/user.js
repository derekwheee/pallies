'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('User Route', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `userRoute-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const response = await internals.server.inject({
            method: 'get',
            url: `/token?email=userRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = response.result.data.accessToken;
    });

    it('get current user', async () => {

        const response = await internals.server.inject({
            method: 'get',
            url: '/user',
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result.data.email).to.equal(`userRoute-${Constants.TEST_USER_EMAIL}`);
        expect(response.result.data.name).to.equal('Test User');
    });

    after(async () => {

        const user = await internals.server.services().userService.getByEmail(`userRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByEmail(`userRoute-${Constants.TEST_USER_EMAIL}`);
    });
});
