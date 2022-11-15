'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Moment = require('moment');
const Argon2 = require('argon2');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

describe('Pallie Service', () => {

    it('create pallie', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        expect(pallie.name).to.equal(Constants.TEST_USER_NAME);
        expect(pallie.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
        expect(pallie.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('create pallie without password', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`
        });

        expect(pallie.name).to.equal(Constants.TEST_USER_NAME);
        expect(pallie.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
        expect(pallie.password).to.be.null();
    });

    it('get pallie by id', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const pallie = await pallieService.getById(id);

        expect(pallie.id).to.equal(id);
        expect(pallie.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get pallie by username', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id, username } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const pallie = await pallieService.getByUsername(username);

        expect(pallie.id).to.equal(id);
        expect(pallie.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });

    it('get all pallies', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const { id } = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const pallies = await pallieService.getAll();

        expect(Array.isArray(pallies)).to.be.true();
        expect(pallies[0].id).to.equal(id);
    });

    it('update pallie', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.update({ ...pallie, name: 'Updated Pallie' });

        const updatedPallie = await pallieService.getById(pallie.id);

        expect(updatedPallie.id).to.equal(pallie.id);
        expect(updatedPallie.username).to.equal(`pallieService-${Constants.TEST_USER_EMAIL}`);
        expect(updatedPallie.name).to.equal('Updated Pallie');
    });

    it('remove pallie', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.remove(pallie.id);

        const deletedPallie = await pallieService.getById(pallie.id);

        expect(deletedPallie).to.not.exist();
    });

    it('remove pallie by email', async () => {

        const server = await Server.deployment();
        const pallieService = server.services().pallieService;

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await pallieService.removeByUsername(pallie.email);

        const deletedPallie = await pallieService.getByUsername(pallie.email);

        expect(deletedPallie).to.not.exist();
    });

    it('create forgot password token', async () => {

        const server = await Server.deployment();
        const { pallieService, tokenService } = server.services();

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        await tokenService.createForgotPasswordToken(pallie);

        expect(pallie.forgotPasswordToken).to.exist();
        expect(pallie.forgotPasswordExpiresAt).to.exist();
        expect(Moment().isBefore(pallie.forgotPasswordExpiresAt)).to.be.true();
    });

    it('reset password', async () => {

        const server = await Server.deployment();
        const { pallieService, tokenService } = server.services();

        const pallie = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `pallieService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const validatePassword = await Argon2.verify(pallie.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validatePassword).to.be.true();

        await tokenService.resetPassword(pallie, 'test321?');

        const updatedPallie = await pallieService.getById(pallie.id);
        const validateNewPassword = await Argon2.verify(updatedPallie.password.toString(), Constants.TEST_USER_PASSWORD);

        expect(validateNewPassword).to.be.false();
    });

    afterEach(async () => {

        const server = await Server.deployment();

        await server.services().pallieService.removeByUsername(`pallieService-${Constants.TEST_USER_EMAIL}`);
    });
});
