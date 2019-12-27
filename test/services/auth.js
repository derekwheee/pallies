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
        expect(user.email).to.equal(`authService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('log in', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(token).to.exist();
        expect('access_token' in token).to.be.true();
        expect('refresh_token' in token).to.be.true();
        expect('token_type' in token).to.be.true();
    });

    it('verify password', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const isVerified = await authService.verifyPassword({ email: `authService-${Constants.TEST_USER_EMAIL}` }, Constants.TEST_USER_PASSWORD);

        expect(isVerified).to.be.true();
    });

    it('validate token', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const { isValid } = authService.validate(token.access_token, { auth: { token: token.access_token } });

        expect(isValid).to.be.true();
    });

    it('validate bad token', () => {

        const authService = internals.server.services().authService;

        const { isValid } = authService.validate('badtoken', { auth: { token: 'badtoken' } });

        expect(isValid).to.be.false();
    });

    it('reauthorize user', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const newTokens = await authService.reauthorize(token.refresh_token);

        expect(newTokens).to.exist();
        expect(newTokens.access_token).to.not.equal(token.access_token);
        expect('access_token' in newTokens).to.be.true();
        expect('refresh_token' in newTokens).to.be.true();
        expect('token_type' in newTokens).to.be.true();
    });

    it('invite user', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const request = {
            auth : {
                credentials : {
                    id: user.id
                }
            }
        };

        const newUser = await authService.invite(request, 'INVITE USER', 'inviteuser@test.com');

        expect(newUser).to.exist();
        expect(newUser.email).to.equal('inviteuser@test.com');
        expect(newUser.forgotPasswordToken).to.not.be.undefined();

        await internals.server.services().userService.removeByEmail('inviteuser@test.com');

    });

    it('forgot password', async () => {

        const authService = internals.server.services().authService;
        const user = await authService.register(Constants.TEST_USER_NAME, `authService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const email = await authService.forgotPassword(user.email);

        expect(email).to.exist();
        expect(email.accepted).to.have.length(1);
        expect(email.rejected).to.have.length(0);
    });

    it('reset password', async () => {

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

        await authService.resetPassword(request, Constants.TEST_USER_PASSWORD, hashids.encode(user.id), null, 'test321?');

        const token = await authService.login(`authService-${Constants.TEST_USER_EMAIL}`, 'test321?');

        expect(token).to.exist();
        expect('access_token' in token).to.be.true();
        expect('refresh_token' in token).to.be.true();
        expect('token_type' in token).to.be.true();

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

        await authService.forgotPassword(user.email);

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

        const user = await internals.server.services().userService.getByEmail(`authService-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByEmail(`authService-${Constants.TEST_USER_EMAIL}`);
    });
});
