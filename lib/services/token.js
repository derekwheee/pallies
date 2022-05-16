'use strict';

const Schmervice = require('@hapipal/schmervice');
const Jwt = require('@hapi/jwt');
const RandToken = require('rand-token');
const Moment = require('moment');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Boom = require('@hapi/boom');

/**
 * @class TokenService
 */
class TokenService extends Schmervice.Service {

    [Schmervice.sandbox] = true;

    initialize() {

        this.RefreshToken = this.server.models().RefreshToken;
        this.User = this.server.models().User;
    }

    /**
    * Create an authorization access token
    * @param {User} user - The user object
    * @returns {object} A JSON web token
    */
    createAccessToken(user) {

        const { userService } = this.server.services();

        const t = Jwt.token.generate({
            iss: this.options.jwt.issuer,
            id: user.id,
            scope: user.role?.name ?? null,
            user: userService.present(user)
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

        const refreshToken = await this.RefreshToken.query(txn)
            .insert({
                userId: user.id,
                token: RandToken.generate(40)
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

        await this.RefreshToken.query(txn)
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
        const { RefreshToken, User } = this.server.models();

        const record = await RefreshToken.query(txn)
            .findOne({ token });

        if (!record) {
            throw Boom.unauthorized('Invalid refresh token');
        }

        if (record.expiredAt < new Date()) {
            throw Boom.unauthorized('Refresh token has expired');
        }

        const user = await User.query(txn)
            .findById(record.userId);

        const accessToken = this.createAccessToken(user);
        const refreshToken = await this.createRefreshToken(user, txn);

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

        const { userService } = this.server.services();

        user.forgotPasswordToken = Csprng(128, 32);
        user.forgotPasswordExpiresAt = Moment().add(4, 'hours').toISOString();

        await userService.update(user, txn);
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

        const hashedPassword = await Argon2.hash(password);

        await this.User.query(txn).findById(id).patch({
            password: hashedPassword
        });
    }
}

module.exports = TokenService;
