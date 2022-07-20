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
            updatedAt: Joi.date().iso(),
            role: Joi.object().allow(null)
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
                    from: 'Pallies.roleId',
                    to: 'Roles.id'
                }
            }
        };
    }

    /**
     * @readonly
     * @static
     */
    static get modifiers() {

        return {
            identityRelations: (builder) => {

                return builder.withGraphFetched('[role]');
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

module.exports = Pallie;
