'use strict';

const Joi = require('joi');

/** @type {Joi} */
module.exports = Joi
    .extend({
        type: /^/,
        rules: {
            nullable: {
                method() {

                    return this.allow(null).default(null);
                }
            }
        }
    });
