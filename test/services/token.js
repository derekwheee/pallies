'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Moment = require('moment');
const Jwt = require('jsonwebtoken');
const Server = require('../../server');
const Constants = require('../constants');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {
    server: null,
    user: null
};

describe('Token Service', () => {

    before(async () => {

        internals.server = await Server.deployment();
        const userService = internals.server.services().userService;

        internals.user = await userService.create({
            identifier: `tokenService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });
    });

    it('create access token', () => {

        const tokenService = internals.server.services().tokenService;
        const token = tokenService.createAccessToken(internals.user);

        const decoded = Jwt.decode(token);

        expect(token).to.exist();
        expect(token).to.be.a.string();
        expect(decoded.id).to.equal(internals.user.id);
        expect(Moment().isBefore(decoded.exp * 1000)).to.be.true();
    });

    it('create refresh token', async () => {

        const tokenService = internals.server.services().tokenService;
        const token = await tokenService.createRefreshToken(internals.user);

        expect(token).to.exist();
        expect(token).to.be.an.object();
    });

    it('validate refresh token', async () => {

        const tokenService = internals.server.services().tokenService;
        const token = await tokenService.createRefreshToken(internals.user);
        const validated = await tokenService.validateRefreshToken(token);

        expect(validated).to.exist();
        expect(validated).to.be.a.object();
        expect('accessToken' in validated).to.be.true();
    });

    it('validate bad refresh token', () => {

        const tokenService = internals.server.services().tokenService;

        expect(tokenService.validateRefreshToken({ token: 'badtoken' })).to.reject('Invalid refresh token');
    });

    it('validate expired refresh token', async () => {

        const tokenService = internals.server.services().tokenService;
        const RefreshToken = internals.server.models().RefreshToken;

        const refreshToken = await RefreshToken.query()
            .insert({
                userId: internals.user.id,
                token: 'expiredtoken',
                expiredAt: new Date(new Date().getTime() - 1 * 86400000)
            });

        expect(tokenService.validateRefreshToken({ token: refreshToken.token })).to.reject('Refresh token has expired');
    });

    it('clear refresh tokens', async () => {

        const tokenService = internals.server.services().tokenService;

        await tokenService.createRefreshToken(internals.user);

        expect(tokenService.clearRefreshTokens(internals.user)).to.not.reject();
    });

    after(async () => {

        const server = await Server.deployment();

        await server.services().tokenService.clearRefreshTokens(internals.user);
        await server.services().userService.removeByIdentifier(`tokenService-${Constants.TEST_USER_EMAIL}`);
    });
});
