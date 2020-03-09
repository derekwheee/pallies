'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Logout Route', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const authService = internals.server.services().authService;

        await authService.register({ name: Constants.TEST_USER_NAME, username: `logoutRoute-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const response = await internals.server.inject({
            method: 'get',
            url: `/token?username=logoutRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = response.result.data.accessToken;
    });

    it('log user out', async () => {

        const { userService } = internals.server.services();
        const { RefreshToken } = internals.server.models();

        const response = await internals.server.inject({
            method: 'post',
            url: '/logout',
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(response.statusCode).to.equal(200);

        const user = await userService.getByUsername(`logoutRoute-${Constants.TEST_USER_EMAIL}`);
        const tokens = await RefreshToken.query().where({ userId : user.id });

        expect(tokens).to.be.an.array();
        expect(tokens.length).to.equal(0);
    });

    it('log unauthenticated user out', async () => {

        const response = await internals.server.inject({
            method: 'post',
            url: '/logout'
        });

        expect(response.statusCode).to.equal(401);
    });

    after(async () => {

        const user = await internals.server.services().userService.getByUsername(`logoutRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByUsername(`logoutRoute-${Constants.TEST_USER_EMAIL}`);
    });
});
