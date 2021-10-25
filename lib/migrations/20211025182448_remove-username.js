'use strict';

exports.up = async (knex) => {

    await knex.schema.table('Users', (t) => {

        t.renameColumn('username', 'identifier');
        t.renameColumn('loginAttempts', 'failedLoginAttempts');
        t.dropForeign('roleId');
        t.dropColumn('roleId');
        t.dropColumn('name');
        t.dropColumn('email');
        t.dropColumn('archivedAt');
        t.dropColumn('passwordExpiresOn');
    });

    await knex.schema.dropTable('Roles');
};

exports.down = async (knex) => {

    await knex.schema.createTable('Roles', (t) => {

        t.increments('id').primary();
        t.string('name');
        t.datetime('createdAt');
        t.datetime('updatedAt');
    });

    await knex.schema.table('Users', (t) => {

        t.renameColumn('identifier', 'username');
        t.renameColumn('failedLoginAttempts', 'loginAttempts');
        t.integer('roleId').unsigned().references('Roles.id');
        t.string('name');
        t.string('email');
        t.datetime('archivedAt');
        t.datetime('passwordExpiresOn');
    });
};
