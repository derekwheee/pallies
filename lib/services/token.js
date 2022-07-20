'use strict';

const Schmervice = require('@hapipal/schmervice');
const Jwt = require('@hapi/jwt');
const RandToken = require('rand-token');
const Moment = require('moment');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Boom = require('@hapi/boom');
const Hashids = require('hashids/cjs');
const Utils = require('../helpers/utils');

/**
 * @class TokenService
 */
class TokenService extends Schmervice.Service {

    initialize() {

        this.hashids = new Hashids('TOKEN SERVICE', 16);
    }

    present(payload) {

        return Utils.present(payload, [
            'accessToken',
            'refreshToken'
        ]);
    }

    /**
    * Create an authorization access token
    * @param {Pallie} pallie - The pallie object
    * @returns {object} A JSON web token
    */
    createAccessToken(pallie) {

        const { pallieService } = this.server.services();

        const t = Jwt.token.generate({
            iss: this.options.jwt.issuer,
            id: pallie.id,
            scope: pallie.role?.name ?? null,
            pallie: pallieService.present(pallie)
        }, {
            key: this.options.tokenSecret,
            algorithm: 'HS256'
        }, {
            ttlSec: this.options.jwt.accessTokenLifespan
        });

        return t;
    }

    /**
    * Create an authorization refresh token
    * @async
    * @param {User} user - The user object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {string} A refresh token
    */
    async createRefreshToken(user, txn) {

        const { RefreshToken } = this.server.models();

        const token = this.#encodeRefreshToken(user.id, RandToken.generate(40));

        const refreshToken = await RefreshToken.query(txn)
            .insert({
                userId: user.id,
                token
            });

        return refreshToken.token;
    }

    /**
    * Remove all refresh tokens belong to a user
    * @async
    * @param {User} user - The user object
    * @param {object} [txn] - An instance of a Knex transaction
    */
    async clearRefreshTokens(user, txn) {

        const { RefreshToken } = this.server.models();

        await RefreshToken.query(txn)
            .delete()
            .where({
                userId: user.id
            });
    }

    /**
    * Validate a refresh token and return new tokens
    * @async
    * @param {string} token - The refresh token
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object} An authorization token object
    */
    async validateRefreshToken(token, txn) {

        /** @type {Models} */
        const { RefreshToken, Pallie } = this.server.models();

        const record = await RefreshToken.query(txn)
            .findOne({ token });

        if (!record || token !== record.token) {
            throw Boom.unauthorized('Invalid refresh token');
        }

        if (record.expiredAt < new Date()) {
            throw Boom.unauthorized('Refresh token has expired');
        }

        const { userId } = this.#decodeRefreshToken(token);

        if (userId !== record.userId) {
            throw Boom.unauthorized('Malformed refresh token');
        }

        const pallie = await Pallie.query(txn)
            .findById(userId);

        const accessToken = this.createAccessToken(pallie);
        const refreshToken = await this.createRefreshToken(pallie, txn);

        await RefreshToken.query(txn).deleteById(record.id);

        return {
            accessToken,
            refreshToken
        };
    }

    /**
    * Assign a forgot password token to a user
    * @async
    * @param {User} user - The user
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async createForgotPasswordToken(user, txn) {

        const { pallieService } = this.server.services();

        user.forgotPasswordToken = Csprng(128, 32);
        user.forgotPasswordExpiresAt = Moment().add(4, 'hours').toISOString();

        await pallieService.update(user, txn);
    }

    /**
    * Reset an existing user's password
    * @async
    * @param {User} user - The user
    * @param {number} user.id - The user's database ID
    * @param {string} password - The user's new password
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async resetPassword({ id }, password, txn) {

        const { Pallie } = this.server.models();

        const hashedPassword = await Argon2.hash(password);

        await Pallie.query(txn).findById(id).patch({
            password: hashedPassword
        });
    }

    /** @access private */
    #encodeRefreshToken(userId, token) {

        const saltedUserId = this.hashids.encode(userId);

        return Buffer.from(JSON.stringify({
            userId: saltedUserId,
            token
        })).toString('base64');
    }

    /** @access private */
    #decodeRefreshToken(raw) {

        const tokenString = Buffer.from(raw, 'base64').toString();
        const { userId, token } = JSON.parse(tokenString);

        return {
            userId: this.hashids.decode(userId)[0],
            token
        };
    }
}

module.exports = TokenService;
