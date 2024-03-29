'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Moment = require('moment');
const Jwt = require('@hapi/jwt');
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
        const pallieService = internals.server.services().pallieService;

        internals.user = await pallieService.create({
            name: Constants.TEST_USER_NAME,
            username: `tokenService-${Constants.TEST_USER_EMAIL}`,
            password: Constants.TEST_USER_PASSWORD
        });
    });

    it('create access token', async () => {

        const tokenService = internals.server.services().tokenService;
        const token = await tokenService.createAccessToken(internals.user);

        const { decoded: { payload } } = Jwt.token.decode(token);

        expect(token).to.exist();
        expect(token).to.be.a.string();
        expect(payload.id).to.equal(internals.user.id);
        expect(Moment().isBefore(payload.exp * 1000)).to.be.true();
    });

    it('create refresh token', async () => {

        const tokenService = internals.server.services().tokenService;
        const token = await tokenService.createRefreshToken(internals.user);

        expect(token).to.exist();
        expect(token).to.be.a.string();
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

        expect(tokenService.validateRefreshToken('badtoken')).to.reject('Invalid refresh token');
    });

    it('validate expired refresh token', async () => {

        const tokenService = internals.server.services().tokenService;
        const RefreshToken = internals.server.models().RefreshToken;
        const token = await tokenService.createRefreshToken(internals.user);

        const [refreshToken] = await RefreshToken.query()
            .patch({
                expiredAt: new Date(new Date().getTime() - 1 * 86400000)
            })
            .where('token', token)
            .returning('*');

        expect(tokenService.validateRefreshToken(refreshToken.token)).to.reject('Refresh token has expired');
    });

    it('clear refresh tokens', async () => {

        const tokenService = internals.server.services().tokenService;

        await tokenService.createRefreshToken(internals.user);

        expect(tokenService.clearRefreshTokens(internals.user)).to.not.reject();
    });

    after(async () => {

        const server = await Server.deployment();

        await server.services().tokenService.clearRefreshTokens(internals.user);
        await server.services().pallieService.removeByUsername(`tokenService-${Constants.TEST_USER_EMAIL}`);
    });
});
