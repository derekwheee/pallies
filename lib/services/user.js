'use strict';

const Joi = require('@hapi/joi');
const Schmervice = require('schmervice');
const SecurePassword = require('secure-password');

module.exports = class ServiceName extends Schmervice.Service {

    initialize() {

        this.User = this.server.models().User;
    }

    async create(clientId, { name, email, password }, txn) {

        const { error } = Joi.validate({ email, name, password }, this.User.joiSchema);

        if (error) {
            throw new Error(error);
        }

        const existingUser = await this.User.query(txn).where('email', email);

        if (existingUser) {
            throw new Error(`${email} is already registered`);
        }

        const hashedPassword = await SecurePassword.hash(Buffer.from(password));

        const user = await this.User.query(txn).insert({
            name,
            email,
            password: hashedPassword,
            client: clientId
        });

        return user;
    }

    async getById(userId, txn) {

        return await this.User.query(txn).findById(userId);
    }

    async getByEmail(email, txn) {

        return await this.User.query(txn).where('email', email);
    }

    async update(user, txn) {

        return await this.getById(user.id, txn).patch(user);
    }

    async remove(userId, txn) {

        return await this.User.query(txn).deleteById(userId);
    }
};
