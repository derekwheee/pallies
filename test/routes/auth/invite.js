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

        const pallieService = internals.server.services().pallieService;
        const authService = internals.server.services().authService;

        const user = await pallieService.create({
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

    it('invite existing user', async () => {

        const pallieService = internals.server.services().pallieService;

        await pallieService.create({
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

        const pallieService = internals.server.services().pallieService;

        await pallieService.create({
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

        const user = await internals.server.services().pallieService.getByUsername(`invite-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().pallieService.removeByUsername(`invite-${Constants.TEST_USER_EMAIL}`);
    });

    after(async () => {

        const user = await internals.server.services().pallieService.getByUsername(`auth-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().pallieService.removeByUsername(`auth-${Constants.TEST_USER_EMAIL}`);
    });
});
