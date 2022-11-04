'use strict';

exports.up = async (knex) => {

    await knex.schema.table('Pallies', (t) => {

        t.dropColumn('roleId');
    });

    await knex.schema.dropTableIfExists('Roles');
};

exports.down = async (knex) => {

    await knex.schema.createTable('Roles', (t) => {

        t.increments('id').primary();
        t.string('name').notNullable().unique();
        t.datetime('createdAt');
        t.datetime('updatedAt');
    });

    await knex.schema.table('Pallies', (t) => {

        t.integer('roleId').unsigned().references('Roles.id');
    });
};
