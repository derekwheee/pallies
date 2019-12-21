'use strict';

// Load modules

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

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

        const user = await authService.register(Constants.TEST_USER_NAME, `registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(user.name).to.equal(Constants.TEST_USER_NAME);
        expect(user.email).to.equal(`registerService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('log in', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        expect(token).to.exist();
        expect('access_token' in token).to.be.true();
        expect('refresh_token' in token).to.be.true();
        expect('token_type' in token).to.be.true();
    });

    it('verify password', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const isVerified = await authService.verifyPassword({ email: `registerService-${Constants.TEST_USER_EMAIL}` }, Constants.TEST_USER_PASSWORD);

        expect(isVerified).to.be.true();
    });

    it('validate token', async () => {

        const authService = internals.server.services().authService;

        await authService.register(Constants.TEST_USER_NAME, `registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);

        const token = await authService.login(`registerService-${Constants.TEST_USER_EMAIL}`, Constants.TEST_USER_PASSWORD);
        const { isValid } = authService.validate(token.access_token, { auth: { token: token.access_token } });

        expect(isValid).to.be.true();
    });

    it('validate token', () => {

        const authService = internals.server.services().authService;

        const { isValid } = authService.validate('badtoken', { auth: { token: 'badtoken' } });

        expect(isValid).to.be.false();
    });

    afterEach(async () => {

        const user = await internals.server.services().userService.getByEmail(`registerService-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().userService.removeByEmail(`registerService-${Constants.TEST_USER_EMAIL}`);
    });
});
