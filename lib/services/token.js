'use strict';

const Schmervice = require('schmervice');
const Crypto = require('crypto');
const Jwt = require('jsonwebtoken');
const Moment = require('moment');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Boom = require('@hapi/boom');

module.exports = class TokenService extends Schmervice.Service {

    [Schmervice.sandbox] = true;

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

    async createRefreshToken({ id: userId }, txn) {

        /** @type {Models} */
        const { RefreshToken } = this.server.models();

        const { token, timestamp } = this.$getRefreshTokenHash(userId);

        await RefreshToken.query(txn).insert({ token, userId });

        return { token, timestamp };
    }

    async clearRefreshTokens(user, txn) {

        const { RefreshToken } = this.server.models();

        await RefreshToken.query(txn)
            .delete()
            .where({
                userId: user.id
            });
    }

    async validateRefreshToken({ token, timestamp }, txn) {

        const { User } = this.server.models();
        const { RefreshToken } = this.server.models();

        const record = await RefreshToken.query(txn).findOne({ token });

        if (!record) {
            throw Boom.unauthorized('Invalid refresh token');
        }

        if (Moment(record.expiredAt).isBefore(Moment())) {
            throw Boom.unauthorized('Refresh token has expired');
        }

        const rehash = this.$getRefreshTokenHash(record.userId, timestamp);

        if (!record || rehash.token !== token) {
            throw Boom.unauthorized('Invalid refresh token');
        }

        const user = await User.query(txn)
            .findById(record.userId);

        const accessToken = this.createAccessToken(user, txn);
        const refreshToken = await this.createRefreshToken(user, txn);

        await RefreshToken.query(txn).deleteById(record.id);

        return {
            accessToken,
            refreshToken
        };
    }

    async createForgotPasswordToken(user, txn) {

        const { userService } = this.server.services();

        user.forgotPasswordToken = Csprng(128, 32);
        user.forgotPasswordExpiresAt = Moment().add(4, 'hours').toISOString();

        await userService.update(user, txn);
    }

    async resetPassword({ id }, password, txn) {

        const { User } = this.server.models();

        const hashedPassword = await Argon2.hash(password);

        await User.query(txn).findById(id).patch({
            password: hashedPassword
        });
    }

    $getRefreshTokenHash(userId, now = Date.now()) {

        const hmac = Crypto.createHmac('sha256', this.options.tokenSecret);

        hmac.update(`${userId}-${now}`);

        return {
            token: hmac.digest('hex'),
            timestamp: now
        };
    }
};
