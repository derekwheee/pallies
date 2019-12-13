'use strict';

exports.up = async (knex) => {

    await knex.schema.createTable('RefreshTokens', (t) => {

        t.increments('id').primary();
        t.string('token').notNullable().unique();
        t.integer('userId').unsigned().notNullable().references('Users.id');
        t.datetime('expiredAt');
    });
};

exports.down = async (knex) => {

    await knex.schema.dropTable('RefreshTokens');
};
