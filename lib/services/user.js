'use strict';

const Joi = require('@hapi/joi');
const Schmervice = require('schmervice');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Moment = require('moment');

module.exports = class UserService extends Schmervice.Service {

    initialize() {

        this.User = this.server.models().User;
    }

    async create({ name, email, password }, txn) {

        Joi.assert({ email, name, password }, this.User.joiSchema);

        const existingUser = await this.User.query(txn).findOne('email', email);

        if (existingUser) {
            throw new Error(`${email} is already registered`);
        }

        const hashedPassword = await Argon2.hash(password);

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

        return await this.User.query(txn).findOne('email', email);
    }

    async update(user, txn) {

        return await this.User.query(txn).findById(user.id).patch(user);
    }

    async remove(userId, txn) {

        return await this.User.query(txn).deleteById(userId);
    }

    async createForgotPasswordToken(user, txn) {

        user.forgotPasswordToken = Csprng(128, 32);
        user.forgotPasswordExpiresAt = Moment().add(4, 'hours').toISOString();

        await this.update(user, txn);
    }

    async resetPassword({ id }, password, txn) {

        const hashedPassword = await Argon2.hash(password);

        await this.User.query(txn).findById(id).patch({
            password: hashedPassword
        });
    }
};
