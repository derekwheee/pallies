'use strict';

const Boom = require('@hapi/boom');
const Schmervice = require('schmervice');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Moment = require('moment');
const Hashids = require('hashids/cjs');

const hashids = new Hashids('SALTY LAD', 16);

module.exports = class AuthService extends Schmervice.Service {

    async register(user, txn) {

        const { userService } = this.server.services();

        try {
            return await userService.create(user, txn);
        }
        catch (err) {
            throw Boom.badRequest(`${user.identifier} is already registered`);
        }
    }

    async login(identifier, password) {

        const { userService, tokenService } = this.server.services();

        const user = await userService.getByIdentifier(identifier);

        if (!user) {
            throw Boom.unauthorized('Username or password is incorrect');
        }

        const isValidPassword = await this.verifyPassword(user, password);

        if (!isValidPassword) {
            throw Boom.unauthorized('Username or password is invalid');
        }

        const accessToken = tokenService.createAccessToken(user);
        let refreshToken;

        if (this.options.jwt.useRefreshTokens) {
            refreshToken = await tokenService.createRefreshToken(user);
        }

        return !this.options.jwt.useRefreshTokens ? accessToken : {
            accessToken,
            refreshToken
        };
    }

    async logout(credentials) {

        const { userService, tokenService  } = this.server.services();

        const user = await userService.getById(credentials.id);

        tokenService.clearRefreshTokens(user);
    }

    async verifyPassword({ identifier }, password) {

        const { User } = this.server.models();

        const user = await User.query().findOne('identifier', identifier);

        return await Argon2.verify(user.password.toString(), password);
    }

    async invite(user, force, txn) {

        const { userService, tokenService  } = this.server.services();

        const { identifier } = user;
        const existingUser = await userService.getByIdentifier(identifier, txn);

        if (existingUser && force) {
            // For use with "Resend invite"
            await userService.remove(existingUser.id, txn);
        }
        else if (existingUser && !force) {
            throw Boom.badRequest(`${identifier} is already registered`);
        }

        // Register new user with temporary password
        const tempPassword = Csprng(128, 32);

        const newUser = await this.register({ ...user, password: tempPassword }, txn);

        await tokenService.createForgotPasswordToken(newUser);

        return {
            hash: hashids.encode(newUser.id),
            token: newUser.forgotPasswordToken
        };
    }

    async forgotPassword(identifier, txn) {

        const { userService, tokenService  } = this.server.services();

        const user = await userService.getByIdentifier(identifier, txn);

        if (!user) {
            throw Boom.badRequest(`${identifier} does not exist`);
        }

        await tokenService.createForgotPasswordToken(user);

        return {
            hash: hashids.encode(user.id),
            token: user.forgotPasswordToken
        };
    }

    async resetPassword(credentials, oldPassword, userHash, forgotPasswordToken, newPassword, txn) {

        const { userService, tokenService  } = this.server.services();

        if (oldPassword) {
            const user = await userService.getById(credentials.id);
            const isValidPassword = await this.verifyPassword(user, oldPassword);

            if (!isValidPassword) {
                throw Boom.unauthorized('Password is invalid');
            }

            return await tokenService.resetPassword(user, newPassword, txn);
        }

        const user = await userService.getById(hashids.decode(userHash)[0]);
        const expiration = Moment(user.forgotPasswordExpiresAt);

        if (!userHash || !forgotPasswordToken) {
            throw Boom.badRequest('Invalid request');
        }

        if (expiration.isBefore(Moment().format())) {
            throw Boom.badRequest('Token has expired');
        }

        if (forgotPasswordToken !== user.forgotPasswordToken) {
            throw Boom.badRequest('Invalid token');
        }

        return await tokenService.resetPassword(user, newPassword, txn);
    }
};
