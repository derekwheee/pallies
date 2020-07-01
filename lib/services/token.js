'use strict';

const Schmervice = require('schmervice');
const Jwt = require('jsonwebtoken');
const RandToken = require('rand-token');
const Moment = require('moment');
const Argon2 = require('argon2');
const Csprng = require('csprng');

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

        delete user.password;

        return Jwt.sign({
            iss: this.options.jwt.issuer,
            exp: new Date().getTime() + 1000 * this.options.jwt.accessTokenLifespan,
            id: user.id,
            user,
            scope: user && user.role ? user.role.name : null
        }, this.options.tokenSecret, { algorithm: 'HS256' });
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

        const record = await this.RefreshToken.query(txn)
            .findOne({ token });

        if (!record) {
            throw new Error('Invalid refresh token');
        }

        if (Moment(record.expiredAt).isBefore(Moment())) {
            throw new Error('Refresh token has expired');
        }

        const user = await this.User.query(txn)
            .findById(record.userId)
            .withGraphFetched('role');

        const accessToken = this.createAccessToken(user, txn);
        const refreshToken = await this.createRefreshToken(user, txn);

        await this.RefreshToken.query(txn).deleteById(record.id);

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
