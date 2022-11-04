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

        internals.user = await authService.register({ name: Constants.TEST_USER_NAME, username: `userRoute-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const { result } = await internals.server.inject({
            method: 'get',
            url: `/token?username=userRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = result.accessToken;
    });

    it('get current user', async () => {

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: '/pallie',
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.id).to.equal(internals.user.id);
        expect(result.username).to.equal(internals.user.username);
    });

    it('update user', async () => {

        const user = await internals.server.services().pallieService.getByUsername(`userRoute-${Constants.TEST_USER_EMAIL}`);

        user.name = 'Test User Update';

        const { result } = await internals.server.inject({
            method: 'post',
            url: '/pallie',
            headers: {
                Authorization: `Bearer ${internals.token}`
            },
            payload: { user }
        });

        expect(result.id).to.equal(user.id);
        expect(result.name).to.equal('Test User Update');
    });

    it('password change fails', async () => {

        const user = await internals.server.services().pallieService.getByUsername(`userRoute-${Constants.TEST_USER_EMAIL}`);
        const originalPassword = user.password;

        user.password = 'newpassword';

        const { result } = await internals.server.inject({
            method: 'post',
            url: '/pallie',
            headers: {
                Authorization: `Bearer ${internals.token}`
            },
            payload: { user }
        });

        const updated = await internals.server.services().pallieService.getByUsername(`userRoute-${Constants.TEST_USER_EMAIL}`);

        expect(result.id).to.equal(user.id);
        expect(updated.password).to.equal(originalPassword);
    });

    after(async () => {

        const user = await internals.server.services().pallieService.getByUsername(`userRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().pallieService.removeByUsername(`userRoute-${Constants.TEST_USER_EMAIL}`);
    });
});
