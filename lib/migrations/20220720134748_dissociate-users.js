'use strict';

exports.up = async (knex) => {

    await knex.schema.renameTable('Users', 'Pallies');

    await knex.schema.table('RefreshTokens', (t) => {

        t.dropForeign([], 'refreshtokens_userid_foreign');
        t.dropColumn('userId');
        t.integer('pallieId').unsigned().notNullable().references('Pallies.id');
    });
};

exports.down = async (knex) => {

    await knex.schema.renameTable('Pallies', 'Users');

    await knex.schema.table('RefreshTokens', (t) => {

        t.dropForeign([], 'refreshtokens_pallieid_foreign');
        t.dropColumn('pallieId');
        t.integer('userId').unsigned().notNullable().references('Users.id');
    });
};
