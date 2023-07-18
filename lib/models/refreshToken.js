'use strict';

const { Model } = require('@hapipal/schwifty');
const Joi = require('joi');
const Config = require(`${process.cwd()}/server/.palliesrc`);

/**
 * @class RefreshToken
 * @extends {Model}
 */
class RefreshToken extends Model {

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
            pallieId: Joi.number().integer().greater(0).required(),
            expiredAt: Joi.date()
        });
    }

    /**
     * @readonly
     * @static
     */
    static get relationMappings() {

        const Pallie = require('./pallie');

        return {
            TokenPallie: {
                relation: Model.BelongsToOneRelation,
                modelClass: Pallie,
                join: {
                    from: 'RefreshTokens.pallieId',
                    to: 'Pallies.id'
                }
            }
        };
    }

    $beforeInsert() {

        const now = new Date();

        this.expiredAt = this.expiredAt || new Date(now.getTime() + Config.refreshToken.lifespan * 1000);
    }
}

module.exports = RefreshToken;
