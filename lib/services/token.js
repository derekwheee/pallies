'use strict';

const Schmervice = require('schmervice');
const Jwt = require('jsonwebtoken');
const RandToken = require('rand-token');
const Moment = require('moment');

module.exports = class TokenService extends Schmervice.Service {

    initialize() {

        this.RefreshToken = this.server.models().RefreshToken;
        this.User = this.server.models().User;
    }

    createAccessToken(user) {

        return Jwt.sign({
            iss: this.options.jwt.issuer,
            exp: new Date().getTime() + 1000 * this.options.jwt.accessTokenLifespan,
            id: user.id
        }, this.options.tokenSecret, { algorithm: 'HS256' });
    }

    async createRefreshToken(user, txn) {

        const refreshToken = await this.RefreshToken.query(txn)
            .insert({
                userId: user.id,
                token: RandToken.generate(40)
            });

        return refreshToken.token;
    }

    async clearRefreshTokens(user, txn) {

        await this.RefreshToken.query(txn)
            .delete()
            .where({
                userId: user.id
            });
    }

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
            .findById(record.userId);

        const accessToken = this.createAccessToken(user, txn);
        const refreshToken = await this.createRefreshToken(user, txn);

        await this.RefreshToken.query(txn).deleteById(record.id);

        return {
            'access_token': accessToken,
            'refresh_token': refreshToken,
            'token_type': 'Bearer'
        };
    }
};
