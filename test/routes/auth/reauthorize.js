'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Reauthorize Route', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const userService = internals.server.services().userService;
        const authService = internals.server.services().authService;

        internals.user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `auth-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        internals.token = await authService.login(internals.user.username, Constants.TEST_USER_PASSWORD);

    });

    it('reauthorize user', async () => {

        const { authService } = internals.server.services();
        const { refreshToken } = await authService.login(internals.user.username, Constants.TEST_USER_PASSWORD);

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: '/reauthorize',
            headers: {
                cookie: `_pallies=${refreshToken};`
            }
        });

        expect(statusCode).to.equal(200);
        expect(result).to.be.a.object();
        expect('accessToken' in result).to.be.true();
        expect('refreshToken' in result).to.be.true();
    });

    it('reauthorize user fails with bad token', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'get',
            url: '/reauthorize',
            headers: {
                cookie: '_pallies=BADTOKEN;'
            }
        });

        expect(statusCode).to.equal(401);
    });

    it('reauthorize fails without cookie', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'get',
            url: '/reauthorize'
        });

        expect(statusCode).to.equal(400);
    });

    it('GET reauthorize fails with payload', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'get',
            url: '/reauthorize',
            payload: { refreshToken: '1234' }
        });

        expect(statusCode).to.equal(400);
    });

    it('POST reauthorize succeeds with payload', async () => {

        const { authService } = internals.server.services();
        const { refreshToken } = await authService.login(internals.user.username, Constants.TEST_USER_PASSWORD);

        const { statusCode } = await internals.server.inject({
            method: 'post',
            url: '/reauthorize',
            payload: { token: refreshToken }
        });

        expect(statusCode).to.equal(200);
    });

    it('POST reauthorize fails without payload', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'post',
            url: '/reauthorize'
        });

        expect(statusCode).to.equal(400);
    });

    it('POST reauthorize user fails with bad token', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'post',
            url: '/reauthorize',
            payload: {
                token: 'BADTOKEN'
            }
        });

        expect(statusCode).to.equal(401);
    });

    after(async () => {

        const user = await internals.server.services().userService.getByUsername(`auth-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().userService.removeByUsername(`auth-${Constants.TEST_USER_EMAIL}`);

        await internals.server.services().roleService.deleteByName('Test Role');
    });
});
