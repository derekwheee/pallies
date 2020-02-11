'use strict';

const Joi = require('@hapi/joi');
const Model = require('./helpers');

/**
 * @class Role
 */
class Role extends Model {

    /**
     * @readonly
     * @static
     */
    static get tableName() {

        return 'Roles';
    }

    /**
     * @readonly
     * @static
     */
    static get joiSchema() {

        return Joi.object({
            id: Joi.number(),
            name: Joi.string().required(),
            createdAt: Joi.date().iso(),
            updatedAt: Joi.date().iso()
        });
    }

    /**
     * @readonly
     * @static
     */
    static get relationMappings() {

        const User = require('./user');

        return {
            users: {
                relation: Model.HasManyRelation,
                modelClass: User,
                join: {
                    from: 'Roles.id',
                    to: 'Users.roleId'
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

module.exports = Role;
