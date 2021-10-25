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
        const userService = server.services().userService;

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        expect(user.identifier).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('get user by id', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const { id } = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await userService.getById(id);

        expect(user.id).to.equal(id);
        expect(user.identifier).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get user by identifier', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const { id, identifier } = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await userService.getByIdentifier(identifier);

        expect(user.id).to.equal(id);
        expect(user.identifier).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get all users', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const users = await userService.getAll();

        expect(Array.isArray(users)).to.be.true();
        expect(users.length).to.be.greaterThan(0);
    });

    it('update user', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.update({ ...user });

        const updatedUser = await userService.getById(user.id);

        expect(updatedUser.id).to.equal(user.id);
        expect(updatedUser.identifier).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
        expect(updatedUser.updatedAt).to.be.greaterThan(user.updatedAt);
    });

    it('remove user', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.remove(user.id);

        const deletedUser = await userService.getById(user.id);

        expect(deletedUser).to.not.exist();
    });

    it('remove user by identifier', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.removeByIdentifier(user.identifier);

        const deletedUser = await userService.getByIdentifier(user.identifier);

        expect(deletedUser).to.not.exist();
    });

    it('create forgot password token', async () => {

        const server = await Server.deployment();
        const { userService, tokenService } = server.services();

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await tokenService.createForgotPasswordToken(user);

        expect(user.forgotPasswordToken).to.exist();
        expect(user.forgotPasswordExpiresAt).to.exist();
        expect(Moment().isBefore(user.forgotPasswordExpiresAt)).to.be.true();
    });

    it('reset password', async () => {

        const server = await Server.deployment();
        const { userService, tokenService } = server.services();

        const user = await userService.create({
            identifier: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const validatePassword = await Argon2.verify(user.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validatePassword).to.be.true();

        await tokenService.resetPassword(user, 'test321?');

        const updatedUser = await userService.getById(user.id);
        const validateNewPassword = await Argon2.verify(updatedUser.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validateNewPassword).to.be.false();
    });

    afterEach(async () => {

        const server = await Server.deployment();

        await server.services().userService.removeByIdentifier(`userService-${Constants.TEST_USER_EMAIL}`);
    });
});
