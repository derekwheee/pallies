'use strict';

exports.up = async (knex) => {

    await knex.schema.table('Users', (t) => {

        t.string('forgotPasswordToken');
        t.timestamp('forgotPasswordExpiresAt');
        t.integer('loginAttempts').notNullable().defaultTo(0);
    });
};

exports.down = async (knex) => {

    await knex.schema.table('Users', (t) => {

        t.dropColumn('forgotPasswordToken');
        t.dropColumn('forgotPasswordExpiresAt');
        t.dropColumn('loginAttempts');
    });
};
