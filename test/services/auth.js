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

        const user = await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        expect(user.identifier).to.equal(`authService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('log in', async () => {

        const authService = internals.server.services().authService;

        await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(token).to.exist();
        expect('accessToken' in token).to.be.true();
    });

    it('log out', async () => {

        const { authService } = internals.server.services();
        const { RefreshToken } = internals.server.models();

        const user = await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        await authService.logout({ id: user.id });

        const tokens = await RefreshToken.query().where({ userId: user.id });

        expect(tokens).to.be.an.array();
        expect(tokens.length).to.equal(0);
    });

    it('verify password', async () => {

        const authService = internals.server.services().authService;

        await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const isVerified = await authService.verifyPassword({ identifier: `authService-${Constants.TEST_USER_EMAIL}` }, Constants.TEST_USER_PASSWORD);

        expect(isVerified).to.be.true();
    });

    it('reauthorize user', async () => {

        const { authService, tokenService } = internals.server.services();

        await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const { payload } = await internals.server.inject({ method: 'POST', url: '/login', payload: { identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD } });

        const { refreshToken, accessToken } = JSON.parse(payload);

        const newTokens = await tokenService.validateRefreshToken(refreshToken);

        expect(newTokens).to.exist();
        expect(newTokens.accessToken).to.not.equal(accessToken);
        expect('accessToken' in newTokens).to.be.true();
    });

    it('invite user', async () => {

        const { authService } = internals.server.services();
        const { User } = internals.server.models();

        const { token } = await authService.invite({ identifier: 'inviteuser@test.com' });

        const newUser = await User.query().findOne({ identifier: 'inviteuser@test.com' });

        expect(newUser).to.exist();
        expect(newUser.identifier).to.equal('inviteuser@test.com');
        expect(newUser.forgotPasswordToken).to.exist();
        expect(newUser.forgotPasswordToken).to.equal(token);

        await internals.server.services().userService.removeByIdentifier('inviteuser@test.com');

    });

    it('forgot password', async () => {

        const authService = internals.server.services().authService;

        await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const user = await authService.forgotPassword(`authService-${Constants.TEST_USER_EMAIL}`);

        expect(user.hasOwnProperty('hash')).to.be.true();
        expect(user.hasOwnProperty('token')).to.be.true();
    });

    it('reset password', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        await authService.forgotPassword(user.identifier);
        await authService.resetPassword({ id: user.id }, Constants.TEST_USER_PASSWORD, hashids.encode(user.id), null, 'test321?');

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, 'test321?');

        expect(token).to.exist();
        expect('accessToken' in token).to.be.true();

    });

    it('set new password', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        await authService.forgotPassword(user.identifier);

        const request = {
            auth: {
                credentials: {
                    id: user.id
                }
            }
        };

        await expect(authService.resetPassword(request, null, hashids.encode(user.id), user.forgotPasswordToken, 'test321?')).to.reject();

    });

    it('set new password bad token', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register({ identifier: `authService-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        await authService.forgotPassword(user.identifier);

        const request = {
            auth: {
                credentials: {
                    id: user.id
                }
            }
        };

        await expect(authService.resetPassword(request, null, hashids.encode(user.id), 'badtoken', 'test321?')).to.reject();
    });

    afterEach(async () => {

        const user = await internals.server.services().userService.getByIdentifier(`authService-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByIdentifier(`authService-${Constants.TEST_USER_EMAIL}`);
    });
});
