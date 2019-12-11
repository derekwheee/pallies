'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');

module.exports = class Client extends Schwifty.Model {

    static get tableName() {

        return 'Clients';
    }

    static get joiSchema() {

        return Joi.object({
            name: Joi.string().min(6).max(255).required()
        });
    }
};
