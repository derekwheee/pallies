'use strict';

const Schmervice = require('schmervice');
const Argon2 = require('argon2');

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

        const existingUser = await this.User.query(txn).findOne('identifier', user.identifier);

        if (existingUser) {
            throw new Error(`${user.identifier} is already registered`);
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
    * Get a user from the database by identifier
    * @async
    * @param {string} identifier - The user's identifier
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User} The user
    */
    async getByIdentifier(identifier, txn) {

        return await this.User.query(txn).findOne('identifier', identifier);
    }

    /**
    * Get all users from the database
    * @async
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User[]} An array of users
    */
    async getAll(txn) {

        return await this.User.query(txn);
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
    * Remove an existing user by identifier
    * @async
    * @param {number} identifier - The user's identifier
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async removeByIdentifier(identifier, txn) {

        return await this.User.query(txn).delete().where({ identifier });
    }
}

module.exports = UserService;
