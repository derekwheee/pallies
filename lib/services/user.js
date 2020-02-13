'use strict';

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
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The newly created user
    */
    async create(user, txn) {

        const existingUser = await this.User.query(txn).findOne('username', user.username);

        if (existingUser) {
            throw new Error(`${user.username} is already registered`);
        }

        user.password = await Argon2.hash(user.password);

        return await this.User.query(txn).insert(user).returning('*');
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
    * Get a user from the database by username
    * @async
    * @param {string} username - The user's username
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The user
    */
    async getByUsername(username, txn) {

        return await this.User.query(txn).findOne('username', username);
    }

    /**
    * Update an existing user
    * @async
    * @param {User} user - The modified user object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async update(user, txn) {

        const entity = this.User.query(txn).findById(user.id);

        // Ensure password isn't updated
        user.password = entity.password;

        return await this.User.query(txn).patch(user).findById(user.id).returning('*');
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
    * Remove an existing user by username
    * @async
    * @param {number} username - The user's username
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async removeByUsername(username, txn) {

        return await this.User.query(txn).delete().where('username', username);
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
