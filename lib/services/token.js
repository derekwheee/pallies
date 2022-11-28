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

    constructor(server, options) {

        super(server, options);

        const { extendJWT } = options;

        this.extendJWT = extendJWT ?? ((p) => p);
    }

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
    async createAccessToken(pallie) {

        const { pallieService } = this.server.services();
        const payload = await this.extendJWT({
            iss: this.options.jwt.issuer,
            id: pallie.id,
            pallie: pallieService.present(pallie)
        });

        return Jwt.token.generate(payload, {
            key: this.options.tokenSecret,
            algorithm: 'HS256'
        }, {
            ttlSec: this.options.jwt.accessTokenLifespan
        });
    }

    /**
    * Create an authorization refresh token
    * @async
    * @param {Pallie} pallie - The pallie object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {string} A refresh token
    */
    async createRefreshToken(pallie, txn) {

        const { RefreshToken } = this.server.models();

        const token = this.#encodeRefreshToken(pallie.id, RandToken.generate(40));

        const refreshToken = await RefreshToken.query(txn)
            .insert({
                pallieId: pallie.id,
                token
            });

        return refreshToken.token;
    }

    /**
    * Remove all refresh tokens belong to a pallie
    * @async
    * @param {Pallie} pallie - The pallie object
    * @param {object} [txn] - An instance of a Knex transaction
    */
    async clearRefreshTokens(pallie, txn) {

        const { RefreshToken } = this.server.models();

        await RefreshToken.query(txn)
            .delete()
            .where({
                pallieId: pallie.id
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

        const { pallieId } = this.#decodeRefreshToken(token);

        if (pallieId !== record.pallieId) {
            throw Boom.unauthorized('Malformed refresh token');
        }

        const pallie = await Pallie.query(txn)
            .findById(pallieId);

        const accessToken = await this.createAccessToken(pallie);
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
    #encodeRefreshToken(pallieId, token) {

        const saltedPallieId = this.hashids.encode(pallieId);

        return Buffer.from(JSON.stringify({
            pallieId: saltedPallieId,
            token
        })).toString('base64');
    }

    /** @access private */
    #decodeRefreshToken(raw) {

        const tokenString = Buffer.from(raw, 'base64').toString();
        const { pallieId, token } = JSON.parse(tokenString);

        return {
            pallieId: this.hashids.decode(pallieId)[0],
            token
        };
    }
}

module.exports = TokenService;
