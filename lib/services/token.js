'use strict';

const Schmervice = require('schmervice');
const Jwt = require('jsonwebtoken');
const RandToken = require('rand-token');
const Moment = require('moment');

/**
 * @class TokenService
 */
class TokenService extends Schmervice.Service {

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

        return Jwt.sign({
            iss: this.options.jwt.issuer,
            exp: new Date().getTime() + 1000 * this.options.jwt.accessTokenLifespan,
            id: user.id,
            role: user.role
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
}

module.exports = TokenService;
