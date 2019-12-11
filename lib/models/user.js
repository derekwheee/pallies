'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');

module.exports = class ModelName extends Schwifty.Model {

    static get tableName() {

        return 'Users';
    }

    static get joiSchema() {

        return Joi.object({
            name: Joi.string().min(6).max(255).required(),
            email: Joi.email().min(6).max(255).required(),
            password: Joi.string().min(6).max(255).required()
        });
    }
};
