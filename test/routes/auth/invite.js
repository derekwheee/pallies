'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../../server');
const Constants = require('../../constants');

const { describe, it, before, after, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Invite User', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const userService = internals.server.services().userService;
        const authService = internals.server.services().authService;

        const user = await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `auth-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        internals.token = await authService.login(user.username, Constants.TEST_USER_PASSWORD);

    });

    it('unauthenticated', async () => {

        const result = await internals.server.inject({
            method: 'post',
            url: '/invite',
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`
                }
            }
        });

        expect(result.statusCode).to.equal(401);
    });

    it('send invite', async () => {

        const result  = await internals.server.inject({
            method: 'post',
            url: '/invite',
            headers: {
                Authorization: `Bearer ${internals.token.accessToken}`
            },
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`
                }
            }
        });

        expect(result.statusCode).to.equal(200);
    });

    it('send invite with role name', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode, result } = await internals.server.inject({
            method: 'post',
            url: '/invite',
            headers: {
                Authorization: `Bearer ${internals.token.accessToken}`
            },
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`
                },
                role: 'Test Role'
            }
        });

        const user = await internals.server.services().userService.getByUsername(`invite-${Constants.TEST_USER_EMAIL}`);

        expect(statusCode).to.equal(200);
        expect(result.hash).to.exist();
        expect(result.token).to.exist();
        expect(user).to.exist();
        expect(user.forgotPasswordToken).to.equal(result.token);

        await internals.server.services().userService.removeByUsername(`invite-${Constants.TEST_USER_EMAIL}`);
        await internals.server.services().roleService.delete(role.id);
    });

    it('send invite with role id', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode, result } = await internals.server.inject({
            method: 'post',
            url: '/invite',
            headers: {
                Authorization: `Bearer ${internals.token.accessToken}`
            },
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`,
                    roleId: role.id
                }
            }
        });

        const user = await internals.server.services().userService.getByUsername(`invite-${Constants.TEST_USER_EMAIL}`);

        expect(statusCode).to.equal(200);
        expect(result.hash).to.exist();
        expect(result.token).to.exist();
        expect(user).to.exist();
        expect(user.forgotPasswordToken).to.equal(result.token);
        expect(user.roleId).to.equal(role.id);

        await internals.server.services().userService.removeByUsername(`invite-${Constants.TEST_USER_EMAIL}`);
        await internals.server.services().roleService.delete(role.id);
    });

    it('invite existing user', async () => {

        const userService = internals.server.services().userService;

        await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `invite-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const { statusCode, result } = await internals.server.inject({
            method: 'post',
            url: '/invite',
            headers: {
                Authorization: `Bearer ${internals.token.accessToken}`
            },
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`
                }
            }
        });

        expect(statusCode).to.equal(400);
        expect(result.message).to.include('already registered');
    });

    it('force invite existing user', async () => {

        const userService = internals.server.services().userService;

        await userService.create({
            name: Constants.TEST_USER_NAME,
            username: `invite-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });

        const result = await internals.server.inject({
            method: 'post',
            url: '/invite',
            headers: {
                Authorization: `Bearer ${internals.token.accessToken}`
            },
            payload: {
                user: {
                    name: Constants.TEST_USER_NAME,
                    username: `invite-${Constants.TEST_USER_EMAIL}`
                },
                force: true
            }
        });

        expect(result.statusCode).to.equal(200);
    });

    afterEach(async () => {

        const user = await internals.server.services().userService.getByUsername(`invite-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().userService.removeByUsername(`invite-${Constants.TEST_USER_EMAIL}`);
    });

    after(async () => {

        const user = await internals.server.services().userService.getByUsername(`auth-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().userService.removeByUsername(`auth-${Constants.TEST_USER_EMAIL}`);
    });
});
