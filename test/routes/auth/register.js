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

        const { statusCode, result } = await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                username: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.name).to.equal(Constants.TEST_USER_NAME);
        expect(result.username).to.equal(`register-${Constants.TEST_USER_EMAIL}`);
        expect('password' in result).to.be.false();
    });

    it('re-register user fails', async () => {

        await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                username: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        const response = await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: {
                name: Constants.TEST_USER_NAME,
                username: `register-${Constants.TEST_USER_EMAIL}`,
                password: Constants.TEST_USER_PASSWORD
            }
        });

        expect(response.statusCode).to.equal(400);
    });

    it('register with role', async () => {

        const { roleService, userService } = internals.server.services();
        const role = await roleService.create('Test Role');
        const user = {
            name: Constants.TEST_USER_NAME,
            username: `register-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD,
            roleId: role.id
        };

        const response = await internals.server.inject({
            method: 'post',
            url: '/register',
            payload: user
        });

        expect(response.result.username).to.equal(`register-${Constants.TEST_USER_EMAIL}`);

        const registered = await userService.getById(response.result.id);

        expect(registered.role).to.not.be.null();
        expect(registered.role.id).to.equal(role.id);

        await userService.removeByUsername(`register-${Constants.TEST_USER_EMAIL}`);
        await roleService.delete(role.id);

    });

    afterEach(async () => {

        await internals.server.services().userService.removeByUsername(`register-${Constants.TEST_USER_EMAIL}`);
    });
});
