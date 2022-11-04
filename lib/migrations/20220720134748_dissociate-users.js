'use strict';

exports.up = async (knex) => {

    await knex.schema.renameTable('Users', 'Pallies');
};

exports.down = async (knex) => {

    await knex.schema.renameTable('Pallies', 'Users');
};
