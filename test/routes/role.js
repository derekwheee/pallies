'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, after, afterEach } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Role Route', () => {

    before(async () => {

        internals.server = await Server.deployment();

        const authService = internals.server.services().authService;

        await authService.register({ name: Constants.TEST_USER_NAME, username: `roleRoute-${Constants.TEST_USER_EMAIL}`, password: Constants.TEST_USER_PASSWORD });

        const { result } = await internals.server.inject({
            method: 'get',
            url: `/token?username=roleRoute-${Constants.TEST_USER_EMAIL}&password=${Constants.TEST_USER_PASSWORD}`
        });

        internals.token = result.accessToken;
    });

    it('create new role', async () => {

        const { statusCode, result } = await internals.server.inject({
            method: 'put',
            url: '/role',
            headers: {
                Authorization: `Bearer ${internals.token}`
            },
            payload: {
                name: 'Test Role'
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.name).to.equal('Test Role');
    });

    it('get role by ID', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: `/role?id=${role.id}`,
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.id).to.equal(role.id);
    });

    it('get role by name', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode, result } = await internals.server.inject({
            method: 'get',
            url: `/role?name=${role.name}`,
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.name).to.equal('Test Role');
    });

    it('update role', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode, result } = await internals.server.inject({
            method: 'post',
            url: '/role',
            headers: {
                Authorization: `Bearer ${internals.token}`
            },
            payload: {
                id: role.id,
                name: 'Updated Role'
            }
        });

        expect(statusCode).to.equal(200);
        expect(result.id).to.equal(role.id);
        expect(result.name).to.equal('Updated Role');
    });

    it('delete role', async () => {

        const role = await internals.server.services().roleService.create('Test Role');

        const { statusCode } = await internals.server.inject({
            method: 'delete',
            url: `/role?id=${role.id}`,
            headers: {
                Authorization: `Bearer ${internals.token}`
            }
        });

        const deletedRole = await internals.server.services().roleService.getById(role.id);

        expect(statusCode).to.equal(204);
        expect(deletedRole).to.not.exist();
    });

    afterEach(async () => {

        await internals.server.models().Role.query().delete().where('name', 'Test Role');
        await internals.server.models().Role.query().delete().where('name', 'Updated Role');
    });

    after(async () => {

        const user = await internals.server.services().pallieService.getByUsername(`roleRoute-${Constants.TEST_USER_EMAIL}`);

        try {
            await internals.server.services().tokenService.clearRefreshTokens(user);
        }
        catch (err) {}

        await internals.server.services().pallieService.removeByUsername(`roleRoute-${Constants.TEST_USER_EMAIL}`);
    });
});
