'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Scoped Route', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const { authService, roleService } = internals.server.services();

        const role = await roleService.create('Test Role');
        const user = {
            name: Constants.TEST_USER_NAME,
            username: `scopedRoute-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD,
            roleId: role.id
        };

        await authService.register(user);

        const { result } = await internals.server.inject({
            method: 'get',
            url: `/token?username=scopedRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = result.accessToken;

        internals.server.route({
            method: 'GET',
            path: '/scoped',
            config: {
                auth: {
                    strategy: 'jwt',
                    access: {
                        scope: 'Test Role'
                    }
                }
            },
            handler: function (request, h) {

                return 'Hello World!';
            }
        });

        internals.server.route({
            method: 'GET',
            path: '/scoped/admin',
            config: {
                auth: {
                    strategy: 'jwt',
                    access: {
                        scope: 'Admin'
                    }
                }
            },
            handler: function (request, h) {

                return 'Hello World!';
            }
        });
    });

    it('access scoped route', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'get',
            url: '/scoped',
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(statusCode).to.equal(200);
    });

    it('forbidden scoped route', async () => {

        const { statusCode } = await internals.server.inject({
            method: 'get',
            url: '/scoped/admin',
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(statusCode).to.equal(403);
    });

    after(async () => {

        const user = await internals.server.services().userService.getByUsername(`scopedRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) { }

        await internals.server.services().userService.removeByUsername(`scopedRoute-${Constants.TEST_USER_EMAIL}`);

        await internals.server.models().Role.query().delete().where('name', 'Test Role');
    });
});
