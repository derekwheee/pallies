'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {
    server: null,
    user: null
};

describe('Email Service', () => {

    before(async () => {

        internals.server = await Server.deployment();
        const userService = internals.server.services().userService;

        internals.user = await userService.create({
            name: Constants.TEST_USER_NAME,
            email: `emailService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });
    });

    it('send user invite without token', () => {

        const emailService = internals.server.services().emailService;

        expect(emailService.sendUserInvite('Inviter', internals.user)).to.reject('Invalid invite token');
    });

    it('send forgot password without token', () => {

        const emailService = internals.server.services().emailService;

        expect(emailService.sendForgotPassword(internals.user)).to.reject('Invalid forgot password token');
    });

    it('send user invite', async () => {

        const emailService = internals.server.services().emailService;
        const userService = internals.server.services().userService;

        await userService.createForgotPasswordToken(internals.user);

        const email = await emailService.sendUserInvite('Inviter', internals.user);

        expect(email).to.exist();
        expect(email.accepted).to.have.length(1);
        expect(email.rejected).to.have.length(0);
    });

    it('send forgot password', async () => {

        const emailService = internals.server.services().emailService;

        const email = await emailService.sendForgotPassword(internals.user);

        expect(email).to.exist();
        expect(email.accepted).to.have.length(1);
        expect(email.rejected).to.have.length(0);
    });

    after(async () => {

        const server = await Server.deployment();

        await server.services().tokenService.clearRefreshTokens(internals.user);
        await server.services().userService.removeByEmail(`emailService-${Constants.TEST_USER_EMAIL}`);
    });
});
