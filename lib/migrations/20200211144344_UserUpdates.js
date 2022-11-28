'use strict';

exports.up = async (knex) => {

    await knex.schema.createTable('Roles', (t) => {

        t.increments('id').primary();
        t.string('name');
        t.datetime('createdAt');
        t.datetime('updatedAt');
    });

    await knex.schema.table('Users', (t) => {

        t.dropUnique('email');
    });

    await knex.schema.table('Users', (t) => {

        t.integer('roleId').unsigned().references('Roles.id');
        t.string('username');
        t.datetime('passwordExpiresOn');
        t.datetime('archivedAt');
        t.datetime('createdAt');
        t.datetime('updatedAt');
        t.string('email').nullable().alter();
    });
};

exports.down = async (knex) => {

    await knex.schema.table('Users', (t) => {

        t.dropColumn('roleId');
        t.dropColumn('username');
        t.dropColumn('passwordExpiresOn');
        t.dropColumn('archivedAt');
        t.dropColumn('createdAt');
        t.dropColumn('updatedAt');
        t.string('email').notNullable().unique().alter();
    });

    await knex.schema.dropTable('Roles');
};
