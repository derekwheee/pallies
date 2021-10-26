'use strict';

const Schmervice = require('schmervice');
const Argon2 = require('argon2');

module.exports = class UserService extends Schmervice.Service {

    present(user) {

        if (!user) {
            return null;
        }

        if (Array.isArray(user)) {
            return user.map((u) => this.present(u));
        }

        const pick = (collect, key) => ({
            ...collect,
            [key]: user[key]
        });

        const display = [
            'id',
            'identifier'
        ].reduce(pick, {});

        return display;
    }

    async create(user, txn) {

        const { User } = this.server.models();

        const existingUser = await User.query(txn).findOne('identifier', user.identifier);

        if (existingUser) {
            throw new Error(`${user.identifier} is already registered`);
        }

        user.password = await Argon2.hash(user.password);

        return this.present(await User.query(txn).insert(user).returning('*'));
    }

    async getById(userId, txn) {

        const { User } = this.server.models();

        return this.present(await User.query(txn).findById(userId));
    }

    async getByIdentifier(identifier, txn) {

        const { User } = this.server.models();

        return this.present(await User.query(txn).findOne('identifier', identifier));
    }

    async getAll(txn) {

        const { User } = this.server.models();

        return this.present(await User.query(txn));
    }

    async update(user, txn) {

        const { User } = this.server.models();

        const entity = User.query(txn).findById(user.id);

        // Ensure password isn't updated
        user.password = entity.password;

        return this.present(await User.query(txn).patch(user).findById(user.id).returning('*'));
    }

    async remove(userId, txn) {

        const { User } = this.server.models();

        return this.present(await User.query(txn).deleteById(userId));
    }

    async removeByIdentifier(identifier, txn) {

        const { User } = this.server.models();

        return this.present(await User.query(txn).delete().where({ identifier }));
    }
};
