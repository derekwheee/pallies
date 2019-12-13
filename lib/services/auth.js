'use strict';

const Schmervice = require('schmervice');
const SecurePassword = require('secure-password');
const Jwt = require('jsonwebtoken');
const PasswordGenerator = require('generate-password');

module.exports = class AuthService extends Schmervice.Service {

    initialize() {

        this.UserService = this.server.services().userService;
        this.EmailService = this.server.services().emailService;
    }

    async register(clientId, name, email, password) {

        return await this.UserService.create(clientId, { name, email, password });
    }

    async login({ email, password }) {

        const user = await this.UserService.getByEmail(email);

        if (!user) {
            throw new Error('Email* or password is incorrect');
        }

        const result = await SecurePassword.verify(password, user.password);

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

        const token = Jwt.sign({
            _id: user.id,
            client: user.client
        }, process.env.TOKEN_SECRET, { algorithm: 'HS256' });

        return token;

    }

    async invite(clientId, name, email, force) {

        const existingUser = await this.UserService.getByEmail({ email });

        if (existingUser && force) {
            // TODO: Delete existing user and continue
            // For use with "Resend invite"
        }
        else if (existingUser && !force) {
            throw new Error(`${email} is already registered`);
        }

        // Register new user with temporary password
        const user = await this.register(clientId, name, email, PasswordGenerator.generate({
            length: 10,
            numbers: true
        }));

        const token = Jwt.sign({
            _id: user.id,
            client: user.client
        }, process.env.TOKEN_SECRET, { algorithm: 'HS256' });

        // TODO: Delete user if email cannot be sent
        await this.EmailService.sendUserInvite(clientId, name, email, token);

        return token;

    }

    validate(token, request) {

        if (!token) {
            return { isValid: false };
        }

        try {
            const verified = Jwt.verify(request.auth.token, process.env.TOKEN_SECRET, { algorithm: 'HS256' });
            return verified ? { isValid: true } : { isValid: false };
        }
        catch (err) {
            return { isValid: false };
        }

    }
};
