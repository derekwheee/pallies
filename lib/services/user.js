'use strict';

const Joi = require('@hapi/joi');
const Schmervice = require('schmervice');
const SecurePassword = require('secure-password')();

module.exports = class UserService extends Schmervice.Service {

    initialize() {

        this.User = this.server.models().User;
    }

    async create(clientId, { name, email, password }, txn) {

        Joi.assert({ email, name, password }, this.User.joiSchema);

        const existingUser = await this.User.query(txn).findOne('email', email);

        if (existingUser) {
            throw new Error(`${email} is already registered`);
        }

        const hashedPassword = await SecurePassword.hash(Buffer.from(password));

        const user = await this.User.query(txn).insert({
            name,
            email,
            password: hashedPassword
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
