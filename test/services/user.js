'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Moment = require('moment');
const Argon2 = require('argon2');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

describe('User Service', () => {

    it('create user', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        expect(user.name).to.equal(Constants.TEST_USER_NAME);
        expect(user.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('get user by id', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await pallieService.getById(id);

        expect(user.id).to.equal(id);
        expect(user.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get user by username', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id, username } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await pallieService.getByUsername(username);

        expect(user.id).to.equal(id);
        expect(user.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get all users', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const users = await pallieService.getAll();

        expect(Array.isArray(users)).to.be.true();
        expect(users[0].id).to.equal(id);
    });

    it('update user', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.update({ ...user, name: 'Updated User' });

        const updatedUser = await pallieService.getById(user.id);

        expect(updatedUser.id).to.equal(user.id);
        expect(updatedUser.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
        expect(updatedUser.name).to.equal('Updated User');
    });

    it('remove user', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.remove(user.id);

        const deletedUser = await pallieService.getById(user.id);

        expect(deletedUser).to.not.exist();
    });

    it('remove user by email', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.removeByUsername(user.email);

        const deletedUser = await pallieService.getByUsername(user.email);

        expect(deletedUser).to.not.exist();
    });

    it('create forgot password token', async () => {

        const server = await Server.deployment();
        const { pallieService, tokenService } = server.services();

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await tokenService.createForgotPasswordToken(user);

        expect(user.forgotPasswordToken).to.exist();
        expect(user.forgotPasswordExpiresAt).to.exist();
        expect(Moment().isBefore(user.forgotPasswordExpiresAt)).to.be.true();
    });

    it('reset password', async () => {

        const server = await Server.deployment();
        const { pallieService, tokenService } = server.services();

        const user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const validatePassword = await Argon2.verify(user.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validatePassword).to.be.true();

        await tokenService.resetPassword(user, 'test321?');

        const updatedUser = await pallieService.getById(user.id);
        const validateNewPassword = await Argon2.verify(updatedUser.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validateNewPassword).to.be.false();
    });

    afterEach(async () => {

        const server = await Server.deployment();

        await server.services().pallieService.removeByUsername(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });
});
