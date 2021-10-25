'use strict';

const Schwifty = require('schwifty');
const Joi = require('joi');

module.exports = class RefreshToken extends Schwifty.Model {

    static tableName = 'RefreshTokens';

    static joiSchema = Joi.object({
        id: Joi.number().integer().greater(0),
        token: Joi.string().min(6).max(255).required(),
        userId: Joi.number().integer().greater(0).required(),
        expiredAt: Joi.date()
    });

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

        // TODO: Hook this to options
        this.expiredAt = this.expiredAt || new Date(now.getTime() + 604800 * 1000);
    }
};
