'use strict';

const Boom = require('@hapi/boom');
const Schmervice = require('schmervice');
const Argon2 = require('argon2');
const Jwt = require('jsonwebtoken');
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
    * @param {string} name - The user's full name
    * @param {string} username - The user's username
    * @param {string} password - The user's password
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created User
    */
    async register(name, username, password, txn) {

        try {
            return await this.UserService.create({ name, username, password }, txn);
        }
        catch (err) {
            return Boom.badRequest(`${username} is already registered`);
        }
    }

    /**
    * Log a user in
    * @async
    * @param {string} username - The user's username address
    * @param {string} password - The user's password
    * @returns {object} A token object with a access and refresh tokens, and the token type
    */
    async login(username, password) {

        const user = await this.UserService.getByUsername(username);

        if (!user) {
            return Boom.unauthorized('Username or password is incorrect');
        }

        const isValidPassword  = await this.verifyPassword(user, password);

        if (!isValidPassword) {
            return Boom.unauthorized('Username or password is invalid');
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
    async validate(token, auth) {

        if (!token) {
            return { isValid: false };
        }

        try {
            const verified = Jwt.verify(auth.token, this.options.tokenSecret, { algorithm: 'HS256' });

            if (verified) {
                const user = await this.UserService.getById(token.id);
                return { isValid: true, credentials: user };
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
            return Boom.badRequest('No token passed for reauthorization');
        }

        return await this.TokenService.validateRefreshToken(token);
    }

    /**
    * Get a user invite token
    * @async
    * @param {object} request - The hapi request object
    * @param {string} name - The new user's name
    * @param {string} username - The new user's username
    * @param {bool} force - If true will remove an existing user and send a new invite
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created user
    */
    async invite(name, username, force, txn) {

        const existingUser = await this.UserService.getByUsername(username, txn);

        if (existingUser && force) {
            // For use with "Resend invite"
            await this.UserService.remove(existingUser.id, txn);
        }
        else if (existingUser && !force) {
            return Boom.badRequest(`${username} is already registered`);
        }

        // Register new user with temporary password
        const tempPassword = Csprng(128, 32);

        const newUser = await this.register(name, username, tempPassword, txn);

        await this.UserService.createForgotPasswordToken(newUser);

        return newUser;
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
            return Boom.badRequest(`${username} does not exist`);
        }

        await this.UserService.createForgotPasswordToken(user);

        return user;
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
                return Boom.unauthorized('Password is invalid');
            }

            return await this.UserService.resetPassword(user, newPassword, txn);
        }

        const user = await this.UserService.getById(hashids.decode(userHash));
        const expiration = Moment(user.forgotPasswordExpiresAt);

        if (!userHash || !forgotPasswordToken) {
            return Boom.badRequest('Invalid request');
        }

        if (expiration.isAfter(Moment().format())) {
            return Boom.badRequest('Token has expired');
        }

        if (forgotPasswordToken !== user.forgotPasswordToken) {
            return Boom.badRequest('Invalid token');
        }

        return await this.UserService.resetPassword(user, newPassword, txn);
    }
}

module.exports = AuthService;
