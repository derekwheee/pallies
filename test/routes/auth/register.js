'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Register', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('register user', async () => {

        const { result } = await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                identifier: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(result.statusCode).to.equal(200);
        expect(result.data.identifier).to.equal(`register-${Constants.TEST_USER_EMAIL}`);
        expect('password' in result.data).to.be.false();
    });

    it('re-register user fails', async () => {

        await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                identifier: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        const response = await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                identifier: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(response.statusCode).to.equal(400);
    });

    afterEach(async () => {

        await internals.server.services().userService.removeByIdentifier(`register-${Constants.TEST_USER_EMAIL}`);
    });
});
