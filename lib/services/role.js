'use strict';

const Schmervice = require('@hapipal/schmervice');
const Utils = require('../helpers/utils');

/**
 * @class RoleService
 */
class RoleService extends Schmervice.Service {

    initialize() {

        this.Role = this.server.models().Role;
    }

    present(role) {

        return Utils.present(role, [
            'id',
            'name',
            'createdAt',
            'updatedAt'
        ]);
    }

    /**
    * Create a new user role
    * @param {string} name - The name of the role
    * @returns {Role} The new role object
    */
    async create(name, txn) {

        return await this.Role.query(txn).insert({ name }).returning('*');
    }

    /**
     * Get all user roles
     * @returns [Role] An array of user roles
     */
    async getAll(txn) {

        return await this.Role.query(txn);
    }

    /**
     * Get user role by ID
     * @returns {Role} A single user role
     */
    async getById(id, txn) {

        return await this.Role.query(txn).findById(id);
    }

    /**
     * Get user role by name
     * @returns {Role} A single user role
     */
    async getByName(name, txn) {

        return await this.Role.query(txn).findOne({ name });
    }

    /**
     * Update a user role
     * @returns {Role} A single user role
     */
    async update(role, txn) {

        return await this.Role.query(txn).patch(role).findById(role.id).returning('*');
    }

    /**
     * Delete a user role
     */
    async delete(id, txn) {

        return await this.Role.query(txn).deleteById(id);
    }

    /**
     * Delete a user role by name
     */
    async deleteByName(name, txn) {

        return await this.Role.query(txn).delete().where('name', name);
    }
}

module.exports = RoleService;
