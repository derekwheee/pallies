'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Jwt = require('@hapi/jwt');
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

        await authService.register({ name: Constants.TEST_USER_NAME, username: `token-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: `/token?username=token-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        expect(statusCode).to.equal(200);
        expect(result).to.be.a.object();
        expect('accessToken' in result).to.be.true();
    });

    it('get user token with role', async () => {

        const { authService, roleService } = internals.server.services();
        const role = await roleService.create('Test Role');

        await authService.register({
            name: Constants.TEST_USER_NAME,
            username: `token-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD,
            roleId: role.id
        });

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: `/token?username=token-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        const { decoded: { payload } } = Jwt.token.decode(result.accessToken);

        expect(statusCode).to.equal(200);
        expect(payload.hasOwnProperty('scope')).to.be.true();
        expect(payload.scope).to.equal(role.name);
    });

    afterEach(async () => {

        const user = await internals.server.services().pallieService.getByUsername(`token-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().pallieService.removeByUsername(`token-${Constants.TEST_USER_EMAIL}`);

        await internals.server.services().roleService.deleteByName('Test Role');
    });
});
