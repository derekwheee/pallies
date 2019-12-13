'use strict';

const { Service } = require('schmervice');

module.exports = class ClientService extends Service {

    initialize() {

        this.Client = this.server.models().Client;
    }

    async create({ name }, txn) {

        const existingClient = await this.Client
            .query(txn)
            .where('name', name);

        if (existingClient) {
            throw new Error(`Client name is already taken`);
        }

        const client = await this.Client.query(txn).insert({
            name
        });

        return client;
    }

    async getById(clientId, txn) {

        return await this.Client.query(txn).getById(clientId);
    }

    async update(client, txn) {

        return await this.Client.query(txn)
            .findById(client.id)
            .patch(client);
    }

    async remove(clientId, txn) {

        return await this.Client.query(txn).deleteById(clientId);
    }

};
