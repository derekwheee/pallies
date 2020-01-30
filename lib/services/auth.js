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
        this.EmailService = this.server.services().emailService;
        this.TokenService = this.server.services().tokenService;
    }

    /**
    * Register a new user
    * @async
    * @param {string} name - The user's full name
    * @param {string} email - The user's email address
    * @param {string} password - The user's password
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created User
    */
    async register(name, email, password, txn) {

        try {
            return await this.UserService.create({ name, email, password }, txn);
        }
        catch (err) {
            return Boom.badRequest(`${email} is already registered`);
        }
    }

    /**
    * Log a user in
    * @async
    * @param {string} email - The user's email address
    * @param {string} password - The user's password
    * @returns {object} A token object with a access and refresh tokens, and the token type
    */
    async login(email, password) {

        const user = await this.UserService.getByEmail(email);

        if (!user) {
            return Boom.unauthorized('Email or password is incorrect');
        }

        const isValidPassword  = await this.verifyPassword(user, password);

        if (!isValidPassword) {
            return Boom.unauthorized('Email or password is invalid');
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
    * @param {string} user.email - The user's email address
    * @param {string} password - The user's password
    * @returns {bool}
    */
    async verifyPassword({ email }, password) {

        const user = await this.UserService.getByEmail(email);

        return await Argon2.verify(user.password.toString(), password);
    }

    /**
    * Validate a request's bearer token
    * @param {string} token - A JSON web token
    * @param {object} request - The hapi request object
    * @returns {object}
    */
    validate(token, request) {

        if (!token) {
            return { isValid: false };
        }

        try {
            const verified = Jwt.verify(request.auth.token, this.options.tokenSecret, { algorithm: 'HS256' });
            return verified ? { isValid: true } : { isValid: false };
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
    * Send an email invitation to a new user
    * @async
    * @param {object} request - The hapi request object
    * @param {string} name - The new user's name
    * @param {string} email - The new user's email address
    * @param {bool} force - If true will remove an existing user and send a new invite
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created user
    */
    async invite(request, name, email, force, txn) {

        const currentUser = await this.UserService.getById(request.auth.credentials.id, txn);
        const existingUser = await this.UserService.getByEmail(email, txn);

        if (existingUser && force) {
            // For use with "Resend invite"
            await this.UserService.remove(existingUser.id, txn);
        }
        else if (existingUser && !force) {
            return Boom.badRequest(`${email} is already registered`);
        }

        // Register new user with temporary password
        const tempPassword = Csprng(128, 32);

        const newUser = await this.register(name, email, tempPassword, txn);

        await this.UserService.createForgotPasswordToken(newUser);

        try {
            await this.EmailService.sendUserInvite(currentUser.name, newUser);
        }
        catch (err) {
            await this.UserService.remove(existingUser.id, txn);
            return Boom.badRequest(`${email} could not be invited`);
        }

        return newUser;
    }

    /**
    * Send a forgot password email to a user
    * @async
    * @param {string} email - The user's email address
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object} The mail object from Nodemailer
    */
    async forgotPassword(email, txn) {

        const user = await this.UserService.getByEmail(email, txn);

        if (!user) {
            return Boom.badRequest(`${email} does not exist`);
        }

        await this.UserService.createForgotPasswordToken(user);

        return await this.EmailService.sendForgotPassword(user);
    }

    /**
    * Reset an existing user's password or set a new user's password
    * @async
    * @param {object} request - The hapi request object
    * @param {string} [oldPassword] - The user's old password, if resetting
    * @param {string} [userHash] - The user hash from an invite email
    * @param {string} forgotPasswordToken - Forgot password token from email
    * @param {string} newPassword - The user's new password
    * @param {object} [txn] - An instance of a Knex transaction
    */
    async resetPassword(request, oldPassword, userHash, forgotPasswordToken, newPassword, txn) {

        if (oldPassword) {
            const user = await this.UserService.getById(request.auth.credentials.id);
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
