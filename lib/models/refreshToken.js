'use strict';

const Schwifty = require('schwifty');
const Joi = require('@hapi/joi');

module.exports = class RefreshToken extends Schwifty.Model {

    static get tableName() {

        return 'RefreshTokens';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            token: Joi.string().min(6).max(255).required(),
            userId: Joi.number().integer().greater(0).required(),
            expiredAt: Joi.date()
        });
    }

    static get relationMappings() {

        const User = require('./user');

        return {
            TokenUser: {
                relation: Schwifty.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'RefreshTokens.userId',
                    to: 'Users.id'
                }
            }
        };
    }

    $beforeInsert() {

        const now = new Date();

        // todo: Expiration time should be configurable. Currently 7 days.
        this.expiredAt = new Date(now.getTime() + 7 * 86400000);
    }
};
