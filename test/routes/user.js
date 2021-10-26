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

        internals.user = await authService.register({ identifier: `userRoute-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const response = await internals.server.inject({
            method: 'get',
            url: `/token?identifier=userRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = response.result.accessToken;
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
        expect(response.result.id).to.equal(internals.user.id);
        expect(response.result.identifier).to.equal(internals.user.identifier);
    });

    it('password change fails', async () => {

        const user = await internals.server.services().userService.getByIdentifier(`userRoute-${Constants.TEST_USER_EMAIL}`);
        const originalPassword = user.password;

        user.password = 'newpassword';

        const response = await internals.server.inject({
            method: 'post',
            url: '/user',
            headers: {
                Authorization: `Bearer ${internals.token}`
            },
            payload: { user }
        });

        const updated = await internals.server.services().userService.getByIdentifier(`userRoute-${Constants.TEST_USER_EMAIL}`);

        expect(response.result.id).to.equal(user.id);
        expect(updated.password).to.equal(originalPassword);
    });

    after(async () => {

        const user = await internals.server.services().userService.getByIdentifier(`userRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByIdentifier(`userRoute-${Constants.TEST_USER_EMAIL}`);
    });
});
