'use strict';

// Load modules

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

// Test shortcuts

const { describe, it, after } = exports.lab = Lab.script();
const { expect } = Code;

describe('Register', () => {

    it('register user', async () => {

        const server = await Server.deployment();

        const response = await server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                email: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(response.statusCode).to.equal(200);
        expect(response.result.name).to.equal(Constants.TEST_USER_NAME);
        expect(response.result.email).to.equal(`register-${Constants.TEST_USER_EMAIL}`);
        expect(response.result.password).to.not.equal(Constants.TEST_USER_PASSWORD);
    });

    it('re-register user fails', async () => {

        const server = await Server.deployment();

        const response = await server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                email: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(response.statusCode).to.equal(400);
    });

    after(async () => {

        const server = await Server.deployment();

        await server.services().userService.removeByEmail(`register-${Constants.TEST_USER_EMAIL}`);
    });
});
