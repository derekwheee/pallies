'use strict';

const Boom = require('@hapi/boom');
const Schmervice = require('schmervice');
const Argon2 = require('argon2');
const Jwt = require('jsonwebtoken');
const Csprng = require('csprng');
const Moment = require('moment');
const Hashids = require('hashids/cjs');

const hashids = new Hashids();

module.exports = class AuthService extends Schmervice.Service {

    initialize() {

        this.UserService = this.server.services().userService;
        this.EmailService = this.server.services().emailService;
        this.TokenService = this.server.services().tokenService;
    }

    async register(name, email, password, txn) {

        return await this.UserService.create({ name, email, password }, txn);
    }

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
            'access_token': accessToken,
            'refresh_token': refreshToken,
            'token_type': 'Bearer'
        };

    }

    async verifyPassword({ email }, password) {

        const user = await this.UserService.getByEmail(email);

        return await Argon2.verify(user.password.toString(), password);
    }

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

    async reauthorize(token) {

        if (!token) {
            return Boom.badRequest('No token passed for reauthorization');
        }

        return await this.TokenService.validateRefreshToken(token);
    }

    async invite(request, clientId, name, email, force, txn) {

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

        // TODO: Delete user if email cannot be sent
        await this.EmailService.sendUserInvite(currentUser.name, newUser);

        return newUser;
    }

    async forgotPassword(email, txn) {

        const user = await this.UserService.getByEmail(email, txn);

        if (!user) {
            return Boom.badRequest(`${email} does not exist`);
        }

        await this.UserService.createForgotPasswordToken(user);

        await this.EmailService.sendForgotPassword(user);
    }

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

        return await this.UserService.resetPassword(null, newPassword, txn);
    }
};
