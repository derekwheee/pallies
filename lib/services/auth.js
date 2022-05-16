'use strict';

const Boom = require('@hapi/boom');
const Schmervice = require('@hapipal/schmervice');
const Argon2 = require('argon2');
const Jwt = require('@hapi/jwt');
const Csprng = require('csprng');
const Moment = require('moment');
const Hashids = require('hashids/cjs');

const hashids = new Hashids('SALTY LAD', 16);

/**
 * @class AuthService
 */
class AuthService extends Schmervice.Service {

    initialize() {

        this.UserService = this.server.services().userService;
        this.TokenService = this.server.services().tokenService;
    }

    /**
    * Register a new user
    * @async
    * @param {object} user - The new user object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created User
    */
    async register(user, txn) {

        try {
            return await this.UserService.create(user, txn);
        }
        catch (err) {
            throw Boom.badRequest(`${user.username} is already registered`);
        }
    }

    /**
    * Log a user in
    * @async
    * @param {string} username - The user's username
    * @param {string} password - The user's password
    * @returns {object} A token object with a access and refresh tokens, and the token type
    */
    async login(username, password) {

        const user = await this.UserService.getByUsername(username);

        if (!user) {
            throw Boom.unauthorized('Username or password is incorrect');
        }

        const isValidPassword = await this.verifyPassword(user, password);

        if (!isValidPassword) {
            throw Boom.unauthorized('Username or password is invalid');
        }

        const accessToken = this.TokenService.createAccessToken(user);
        let refreshToken;

        if (this.options.jwt.useRefreshTokens) {
            refreshToken = await this.TokenService.createRefreshToken(user);
        }

        return !this.options.jwt.useRefreshTokens ? accessToken : {
            accessToken,
            refreshToken
        };
    }

    /**
    * Log a user out
    * @async
    * @param {object} credentials - The hapi credentials object
    */
    async logout(credentials) {

        const user = await this.UserService.getById(credentials.id);

        this.TokenService.clearRefreshTokens(user);
    }

    /**
    * Verify a user's password
    * @async
    * @param {object} user - The user's full name
    * @param {string} user.username - The user's username
    * @param {string} password - The user's password
    * @returns {bool}
    */
    async verifyPassword({ username }, password) {

        const user = await this.UserService.getByUsername(username);

        return await Argon2.verify(user.password.toString(), password);
    }

    /**
    * Validate a request's bearer token
    * @param {string} token - A JSON web token
    * @param {object} auth - The hapi auth object
    * @returns {object}
    */
    validate(token, auth) {

        if (!token) {
            return { isValid: false };
        }

        try {
            const verified = Jwt.verify(auth.token, this.options.tokenSecret, { algorithm: 'HS256' });

            if (verified) {
                return { isValid: true, credentials: token };
            }

            return { isValid: false };
        }
        catch (err) {
            return { isValid: false };
        }

    }

    /**
    * Update user's authentication using refresh token
    * @async
    * @param {object} token - A refresh token
    * @returns {object} A token object with a access and refresh tokens, and the token type
    */
    async reauthorize(token) {

        if (!token) {
            throw Boom.badRequest('No token passed for reauthorization');
        }

        return await this.TokenService.validateRefreshToken(token);
    }

    /**
    * Get a user invite token
    * @async
    * @param {User} user - The new user object
    * @param {bool} force - If true will remove an existing user and send a new invite
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created user
    */
    async invite(user, force, txn) {

        const { username } = user;
        const existingUser = await this.UserService.getByUsername(username, txn);

        if (existingUser && force) {
            // For use with "Resend invite"
            await this.UserService.remove(existingUser.id, txn);
        }
        else if (existingUser && !force) {
            throw Boom.badRequest(`${username} is already registered`);
        }

        // Register new user with temporary password
        const tempPassword = Csprng(128, 32);

        const newUser = await this.register({ ...user, password: tempPassword }, txn);

        await this.TokenService.createForgotPasswordToken(newUser);

        return {
            hash: hashids.encode(newUser.id),
            token: newUser.forgotPasswordToken
        };
    }

    /**
    * Get a forgot password token
    * @async
    * @param {string} username - The user's username
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} A user with a forgot password token
    */
    async forgotPassword(username, txn) {

        const user = await this.UserService.getByUsername(username, txn);

        if (!user) {
            throw Boom.badRequest(`${username} does not exist`);
        }

        await this.TokenService.createForgotPasswordToken(user);

        return {
            hash: hashids.encode(user.id),
            token: user.forgotPasswordToken
        };
    }

    /**
    * Reset an existing user's password or set a new user's password
    * @async
    * @param {object} credentials - The hapi credentials object
    * @param {string} [oldPassword] - The user's old password, if resetting
    * @param {string} [userHash] - The user hash from an invite email
    * @param {string} forgotPasswordToken - Forgot password token from email
    * @param {string} newPassword - The user's new password
    * @param {object} [txn] - An instance of a Knex transaction
    */
    async resetPassword(credentials, oldPassword, userHash, forgotPasswordToken, newPassword, txn) {

        if (oldPassword) {
            const user = await this.UserService.getById(credentials.id);
            const isValidPassword = await this.verifyPassword(user, oldPassword);

            if (!isValidPassword) {
                throw Boom.unauthorized('Password is invalid');
            }

            return await this.TokenService.resetPassword(user, newPassword, txn);
        }

        const user = await this.UserService.getById(hashids.decode(userHash)[0]);
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

        return await this.TokenService.resetPassword(user, newPassword, txn);
    }
}

module.exports = AuthService;
