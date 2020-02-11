'use strict';

const Model = require('./helpers');
const Joi = require('@hapi/joi');

/**
 * @class User
 * @extends {Model}
 */
class User extends Model {

    /**
     * @readonly
     * @static
     */
    static get tableName() {

        return 'Users';
    }

    /**
     * @readonly
     * @static
     */
    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            roleId: Joi.number().allow(null),
            name: Joi.string().min(6).max(255).allow(null),
            username: Joi.string().min(6).max(255).required(),
            email: Joi.string().email().min(6).max(255).allow(null),
            password: Joi.binary().required(),
            loginAttempts: Joi.number().integer().min(0),
            forgotPasswordToken: Joi.string().max(255).allow(null),
            forgotPasswordExpiresAt: Joi.date().iso().allow(null),
            passwordExpiresOn: Joi.date().iso().allow(null),
            archivedAt: Joi.date().iso().allow(null),
            createdAt: Joi.date().iso(),
            updatedAt: Joi.date().iso()
        });
    }

    /**
     * @readonly
     * @static
     */
    static get relationMappings() {

        const Role = require('./role');

        return {
            role: {
                relation: Model.BelongsToOneRelation,
                modelClass: Role,
                join: {
                    from: 'Users.roleId',
                    to: 'Roles.id'
                }
            }
        };
    }

    $beforeInsert() {

        this.createdAt = this.updatedAt = new Date().toISOString();
    }

    $beforeUpdate() {

        this.updatedAt = new Date().toISOString();
    }
}

module.exports = User;
