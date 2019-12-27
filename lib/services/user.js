'use strict';

const Joi = require('@hapi/joi');
const Schmervice = require('schmervice');
const Argon2 = require('argon2');
const Csprng = require('csprng');
const Moment = require('moment');

/**
 * @class UserService
 */
class UserService extends Schmervice.Service {

    initialize() {

        this.User = this.server.models().User;
    }

    /**
    * Create a new user
    * @async
    * @param {object} user - A new user object
    * @param {string} user.name - The new user's name
    * @param {string} user.email - The new user's email address
    * @param {string} user.password - The new user's password
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created user
    */
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

    /**
    * Get a user from the database by ID
    * @async
    * @param {number} userId - The user's database ID
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The user
    */
    async getById(userId, txn) {

        return await this.User.query(txn).findById(userId);
    }

    /**
    * Get a user from the database by email address
    * @async
    * @param {string} email - The user's email address
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The user
    */
    async getByEmail(email, txn) {

        return await this.User.query(txn).findOne('email', email);
    }

    /**
    * Update an existing user
    * @async
    * @param {User} user - The modified user object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async update(user, txn) {

        return await this.User.query(txn).findById(user.id).patch(user);
    }

    /**
    * Remove an existing user by ID
    * @async
    * @param {number} userId - The user's database ID
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async remove(userId, txn) {

        return await this.User.query(txn).deleteById(userId);
    }

    /**
    * Remove an existing user by email address
    * @async
    * @param {number} email - The user's email address
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async removeByEmail(email, txn) {

        return await this.User.query(txn).delete().where('email', email);
    }

    /**
    * Assign a forgot password token to a user
    * @async
    * @param {User} user - The user
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async createForgotPasswordToken(user, txn) {

        user.forgotPasswordToken = Csprng(128, 32);
        user.forgotPasswordExpiresAt = Moment().add(4, 'hours').toISOString();

        await this.update(user, txn);
    }

    /**
    * Reset an existing user's password
    * @async
    * @param {User} user - The user
    * @param {number} user.id - The user's database ID
    * @param {string} password - The user's new password
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async resetPassword({ id }, password, txn) {

        const hashedPassword = await Argon2.hash(password);

        await this.User.query(txn).findById(id).patch({
            password: hashedPassword
        });
    }
}

module.exports = UserService;
