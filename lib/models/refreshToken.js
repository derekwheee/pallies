'use strict';

const Schwifty = require('schwifty');
const Joi = require('@hapi/joi');
const Config = require(`${process.cwd()}/server/.palliesrc`).pallies;

/**
 * @class RefreshToken
 * @extends {Schwifty.Model}
 */
class RefreshToken extends Schwifty.Model {

    /**
     * @readonly
     * @static
     */
    static get tableName() {

        return 'RefreshTokens';
    }

    /**
     * @readonly
     * @static
     */
    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            token: Joi.string().min(6).max(255).required(),
            userId: Joi.number().integer().greater(0).required(),
            expiredAt: Joi.date()
        });
    }

    /**
     * @readonly
     * @static
     */
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

        this.expiredAt = this.expiredAt || new Date(now.getTime() + Config.jwt.refreshTokenLifespan * 1000);
    }
}

module.exports = RefreshToken;
