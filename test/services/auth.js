'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');
const Hashids = require('hashids/cjs');

const { describe, it, before, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

const hashids = new Hashids('SALTY LAD', 16);

const internals = {
    server: null,
    user: null
};

describe('Auth Service', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('register user', async () => {

        const authService = internals.server.services().authService;

        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(user.name).to.equal(Constants.TEST_USER_NAME);
        expect(user.username).to.equal(`authService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('log in', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(token).to.exist();
        expect('accessToken' in token).to.be.true();
    });

    it('verify password', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const isVerified = await authService.verifyPassword({ username: `authService-${Constants.TEST_USER_EMAIL}` }, Constants.TEST_USER_PASSWORD);

        expect(isVerified).to.be.true();
    });

    it('validate token', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const { isValid } = await authService.validate({ id: user.id }, { token: token.accessToken });

        expect(isValid).to.be.true();
    });

    it('validate bad token', async () => {

        const authService = internals.server.services().authService;

        const { isValid } = await authService.validate('badtoken', { auth: { token: 'badtoken' } });

        expect(isValid).to.be.false();
    });

    it('reauthorize user', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const { payload, headers } = await internals.server.inject({ method: 'GET', url: `/token?username=authService-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}` });
        const refreshToken = headers['set-cookie'][0].match(/=([^;]+)/)[1];

        const newTokens = await authService.reauthorize(refreshToken);

        expect(newTokens).to.exist();
        expect(newTokens.accessToken).to.not.equal(payload.accessToken);
        expect('accessToken' in newTokens).to.be.true();
    });

    it('invite user', async () => {

        const authService = internals.server.services().authService;

        const newUser = await authService.invite('INVITE USER', 'inviteuser@test.com');

        expect(newUser).to.exist();
        expect(newUser.username).to.equal('inviteuser@test.com');
        expect(newUser.forgotPasswordToken).to.not.be.undefined();

        await internals.server.services().userService.removeByUsername('inviteuser@test.com');

    });

    it('forgot password', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const user = await authService.forgotPassword(`authService-${Constants.TEST_USER_EMAIL}`);

        expect(user.hasOwnProperty('forgotPasswordToken')).to.be.true();
        expect(user.hasOwnProperty('forgotPasswordExpiresAt')).to.be.true();
    });

    it('reset password', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        await authService.forgotPassword(user.email);
        await authService.resetPassword({ id: user.id }, Constants.TEST_USER_PASSWORD, hashids.encode(user.id), null, 'test321?');

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, 'test321?');

        expect(token).to.exist();
        expect('accessToken' in token).to.be.true();

    });

    it('set new password', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        await authService.forgotPassword(user.email);

        const request = {
            auth : {
                credentials : {
                    id: user.id
                }
            }
        };

        const result = await authService.resetPassword(request, null, hashids.encode(user.id), user.forgotPasswordToken, 'test321?');

        expect('isBoom' in result).to.be.true();
        expect(result.isBoom).to.be.true();

    });

    it('set new password bad token', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        await authService.forgotPassword(user.username);

        const request = {
            auth : {
                credentials : {
                    id: user.id
                }
            }
        };

        const result = await authService.resetPassword(request, null, hashids.encode(user.id), 'badtoken', 'test321?');

        expect('isBoom' in result).to.be.true();
        expect(result.isBoom).to.be.true();

    });

    afterEach(async () => {

        const user = await internals.server.services().userService.getByUsername(`authService-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByUsername(`authService-${Constants.TEST_USER_EMAIL}`);
    });
});
