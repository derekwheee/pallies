'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

describe('Validation', () => {

    before(async () => {

        const server = await Server.deployment();

        await server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                email: `validation-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });
    });

    it('user is not validated', async () => {

        const server = await Server.deployment();

        const response = await server.inject({
            method: 'get',
            url: '/validate',
            payload: {

            }
        });

        expect(response.statusCode).to.equal(401);
    });

    after(async () => {

        const server = await Server.deployment();

        await server.services().pallieService.removeByUsername(`validation-${Constants.TEST_USER_EMAIL}`);
    });
});
