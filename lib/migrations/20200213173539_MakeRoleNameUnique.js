'use strict';

exports.up = async (knex) => {

    await knex.schema.table('Roles', (t) => {

        t.string('name').notNullable().unique().alter();
    });
};

exports.down = async (knex) => {

    await knex.schema.table('Roles', (t) => {

        t.string('name').nullable().alter();
        t.dropUnique('name');
    });
};
