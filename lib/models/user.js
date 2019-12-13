'use strict';

const Schwifty = require('schwifty');
const Joi = require('@hapi/joi');

module.exports = class User extends Schwifty.Model {

    static get tableName() {

        return 'Users';
    }

    static get joiSchema() {

        return Joi.object({
            name: Joi.string().min(6).max(255).required(),
            email: Joi.string().email().min(6).max(255).required(),
            password: Joi.binary().required()
        });
    }
};
