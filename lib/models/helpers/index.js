'use strict';

const Schwifty = require('schwifty');
const { DbErrors } = require('objection-db-errors');

module.exports = class Model extends DbErrors(Schwifty.Model) {

    static createNotFoundError(ctx) {

        const error = super.createNotFoundError(ctx);

        return Object.assign(error, {
            modelName: this.name
        });
    }

    static field(name) {

        return this.getJoiSchema().extract(name)
            .optional()
            .options({ noDefaults: true });
    }
};
