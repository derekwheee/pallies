'use strict';

const Dotenv = require('dotenv');
const Schwifty = require('@hapipal/schwifty');
const Confidence = require('confidence');
const Toys = require('toys');
// TODO: Merge a default config with a project-specific config
const Pallies = require(`${__dirname}/.palliesrc`);

// Pull .env into process.env
Dotenv.config({ path: `${__dirname}/.env` });

// Glue manifest as a confidence store
module.exports = new Confidence.Store({
    server: {
        host: 'localhost',
        port: {
            $env: 'PORT',
            $coerce: 'number',
            $default: 3000
        },
        debug: {
            $filter: { $env: 'NODE_ENV' },
            $default: {
                log: ['error']
            },
            production: {
                request: ['implementation']
            },
            test: {
                request: ['error']
            }
        }
    },
    register: {
        plugins: [
            {
                plugin: '../lib', // Main plugin
                options: {
                    isDev: {
                        $filter: {
                            $env: 'NODE_ENV'
                        },
                        $default: false,
                        production: false,
                        development: true
                    },
                    ...Pallies
                }
            },
            {
                plugin: {
                    $filter: { $env: 'NODE_ENV' },
                    $default: 'hpal-debug',
                    production: Toys.noop
                }
            },
            {
                plugin: '@hapipal/schwifty',
                options: {
                    $filter: { $env: 'NODE_ENV' },
                    $default: {},
                    $base: {
                        migrateOnStart: true,
                        knex: {
                            client: 'pg',
                            connection: {
                                host: { $env: 'DB_HOST' },
                                user: { $env: 'DB_USER' },
                                password: { $env: 'DB_PASSWORD' },
                                database: { $env: 'DB_NAME' }
                            },
                            migrations: {
                                stub: Schwifty.migrationsStubPath
                            }
                        }
                    },
                    production: {
                        migrateOnStart: false
                    }
                }
            }
        ]
    }
});
