'use strict';

const Schmervice = require('@hapipal/schmervice');
const Argon2 = require('argon2');
const Utils = require('../helpers/utils');

/**
 * @class PallieService
 */
class PallieService extends Schmervice.Service {

    initialize() {

        this.Pallie = this.server.models().Pallie;
    }

    present(user) {

        return Utils.present(user, [
            'id',
            'name',
            'email',
            'username',
            'createdAt',
            'updatedAt'
        ]);
    }

    /**
    * Create a new pallie
    * @async
    * @param {object} pallie - A new pallie object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {Pallie} The newly created pallie
    */
    async create(pallie, txn) {

        const existingUser = await this.Pallie.query(txn).findOne('username', pallie.username);

        if (existingUser) {
            throw new Error(`${pallie.username} is already registered`);
        }

        if (pallie.password) {
            pallie.password = await Argon2.hash(pallie.password);
        }

        return await this.Pallie.query(txn).insert(pallie).returning('*');
    }

    /**
    * Get a pallie from the database by ID
    * @async
    * @param {number} pallieId - The pallie's database ID
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {Pallie} The pallie
    */
    async getById(pallieId, txn) {

        return await this.Pallie.query(txn).findById(pallieId);
    }

    /**
    * Get a user from the database by username
    * @async
    * @param {string} username - The user's username
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {Pallie} The pallie
    */
    async getByUsername(username, txn) {

        return await this.Pallie.query(txn).findOne('username', username);
    }

    /**
    * Get all users from the database
    * @async
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {User[]} An array of users
    */
    async getAll(txn) {

        return await this.Pallie.query(txn);
    }

    /**
    * Update an existing user
    * @async
    * @param {Pallie} pallie - The modified pallie object
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async update(pallie, txn) {

        const entity = this.Pallie.query(txn).findById(pallie.id);

        // Ensure password isn't updated
        pallie.password = entity.password;

        return await this.Pallie.query(txn).patch(pallie).findById(pallie.id).returning('*');
    }

    /**
    * Remove an existing pallie by ID
    * @async
    * @param {number} pallieId - The pallie's database ID
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async remove(pallieId, txn) {

        return await this.Pallie.query(txn).deleteById(pallieId);
    }

    /**
    * Remove an existing user by username
    * @async
    * @param {number} username - The user's username
    * @param {object} [txn] - An instance of a Knex transaction
    * @returns {object}
    */
    async removeByUsername(username, txn) {

        return await this.Pallie.query(txn).delete().where('username', username);
    }
}

module.exports = PallieService;
