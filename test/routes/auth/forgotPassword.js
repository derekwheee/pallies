'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Forgot Password', () => {

    before(async () => {

        internals.server = await Server.deployment(null, true);
    });

    it('send forgot password', async () => {

        const userService = internals.server.services().userService;

        const user = await userService.create({
            identifier: `forgotPassword-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const { result } = await internals.server.inject({
            method: 'post',
            url: '/forgotpassword',
            payload: {
                identifier: user.identifier
            }
        });

        expect(result.statusCode).to.equal(200);
    });

    after(async () => {

        await internals.server.services().userService.removeByIdentifier(`forgotPassword-${Constants.TEST_USER_EMAIL}`);
    });
});
