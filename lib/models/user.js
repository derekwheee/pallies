'use strict';

const Model = require('./helpers');
const Joi = require('joi');

module.exports = class User extends Model {

    static tableName = 'Users'

    static joiSchema = Joi.object({
        id: Joi.number().integer().greater(0),
        identifier: Joi.string().min(6).max(255).required(),
        password: Joi.binary().required(),
        failedLoginAttempts: Joi.number().integer().min(0),
        forgotPasswordToken: Joi.string().max(255).allow(null),
        forgotPasswordExpiresAt: Joi.date().iso().allow(null),
        createdAt: Joi.date().iso(),
        updatedAt: Joi.date().iso()
    })

    $beforeInsert() {

        this.createdAt = this.updatedAt = new Date().toISOString();
    }

    $beforeUpdate() {

        this.updatedAt = new Date().toISOString();
    }
};
