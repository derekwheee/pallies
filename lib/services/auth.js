'use strict';

const Schmervice = require('schmervice');
const SecurePassword = require('secure-password')();
const Jwt = require('jsonwebtoken');
const PasswordGenerator = require('generate-password');

module.exports = class AuthService extends Schmervice.Service {

    initialize() {

        this.UserService = this.server.services().userService;
        this.EmailService = this.server.services().emailService;
        this.TokenService = this.server.services().tokenService;
    }

    async register(clientId, name, email, password) {

        return await this.UserService.create(clientId, { name, email, password });
    }

    async login(email, password) {

        const user = await this.UserService.getByEmail(email);

        if (!user) {
            throw new Error('Email* or password is incorrect');
        }

        const result = await SecurePassword.verify(Buffer.from(password), Buffer.from(user.password, 'binary'));

        switch (result) {
            case SecurePassword.INVALID_UNRECOGNIZED_HASH:
                throw new Error('Email or password* is incorrect');
            case SecurePassword.INVALID:
                throw new Error('Email or password* is incorrect');
            case SecurePassword.VALID:
                break;
            case SecurePassword.VALID_NEEDS_REHASH:
                // Rehash the password
                await SecurePassword.hash(password);
                // todo: Store the rehashed password
                break;
        }

        const accessToken = this.TokenService.createAccessToken(user);
        let refreshToken;

        if (this.options.jwt.userRefreshTokens) {
            refreshToken = await this.TokenService.createRefreshToken(user);
        }

        return !this.options.jwt.userRefreshTokens ? accessToken : {
            'access_token': accessToken,
            'refresh_token': refreshToken,
            'token_type': 'Bearer'
        };

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
            throw new Error('No token passed for reauthorization');
        }

        return await this.TokenService.validateRefreshToken(token);
    }

    async invite(request, clientId, name, email, force) {

        const currentUser = await this.UserService.getById(request.auth.credentials.id);
        const existingUser = await this.UserService.getByEmail({ email });

        if (existingUser && force) {
            // For use with "Resend invite"
            await this.UserService.remove(existingUser.id);
        }
        else if (existingUser && !force) {
            throw new Error(`${email} is already registered`);
        }

        // Register new user with temporary password
        const tempPassword = PasswordGenerator.generate({
            length: 10,
            numbers: true
        });

        await this.register(clientId, name, email, tempPassword);

        const tokens = await this.login(email, tempPassword);

        // TODO: Delete user if email cannot be sent
        await this.EmailService.sendUserInvite(clientId, currentUser.name, name, email, tokens);

        return tokens;

    }
};
