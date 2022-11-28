'use strict';

const { Model } = require('@hapipal/schwifty');
const Joi = require('joi');

/**
 * @class Pallie
 * @extends {Model}
 */
class Pallie extends Model {

    /**
     * @readonly
     * @static
     */
    static get tableName() {

        return 'Pallies';
    }

    /**
     * @readonly
     * @static
     */
    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            name: Joi.string().min(6).max(255).allow(null),
            username: Joi.string().min(6).max(255).required(),
            email: Joi.string().email().min(6).max(255).allow(null),
            password: Joi.binary(),
            loginAttempts: Joi.number().integer().min(0),
            forgotPasswordToken: Joi.string().max(255).allow(null),
            forgotPasswordExpiresAt: Joi.date().iso().allow(null),
            passwordExpiresOn: Joi.date().iso().allow(null),
            archivedAt: Joi.date().iso().allow(null),
            createdAt: Joi.date().iso(),
            updatedAt: Joi.date().iso()
        });
    }

    $beforeInsert() {

        this.createdAt = this.updatedAt = new Date().toISOString();
    }

    $beforeUpdate() {

        this.updatedAt = new Date().toISOString();
    }
}

module.exports = Pallie;
