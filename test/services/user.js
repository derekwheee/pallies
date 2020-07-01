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
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        expect(user.name).to.equal(Constants.TEST_USER_NAME);
        expect(user.username).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
        expect(user.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('get user by id', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const { id } = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await userService.getById(id);

        expect(user.id).to.equal(id);
        expect(user.username).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get user by username', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const { id, username } = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const user = await userService.getByUsername(username);

        expect(user.id).to.equal(id);
        expect(user.username).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get all users', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const { id } = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const users = await userService.getAll();

        expect(Array.isArray(users)).to.be.true();
        expect(users[0].id).to.equal(id);
    });

    it('update user', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.update({ ...user, name: 'Updated User' });

        const updatedUser = await userService.getById(user.id);

        expect(updatedUser.id).to.equal(user.id);
        expect(updatedUser.username).to.equal(`userService-${Constants.TEST_USER_EMAIL}`);
        expect(updatedUser.name).to.equal('Updated User');
    });

    it('remove user', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.remove(user.id);

        const deletedUser = await userService.getById(user.id);

        expect(deletedUser).to.not.exist();
    });

    it('remove user by email', async () => {

        const server = await Server.deployment();
        const userService = server.services().userService;

        const user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await userService.removeByUsername(user.email);

        const deletedUser = await userService.getByUsername(user.email);

        expect(deletedUser).to.not.exist();
    });

    it('create forgot password token', async () => {

        const server = await Server.deployment();
        const { userService, tokenService } = server.services();

        const user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
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
            name: Constants.TEST_USER_NAME,
            username: `userService-${Constants.TEST_USER_EMAIL}`,
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

        await server.services().userService.removeByUsername(`userService-${Constants.TEST_USER_EMAIL}`);
    });
});
