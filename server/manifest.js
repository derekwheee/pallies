'use strict';

const Dotenv = require('dotenv');
const Schwifty = require('schwifty');
const Confidence = require('confidence');
const Toys = require('toys');

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
                    tokenSecret: {
                        $filter: {
                            $env: 'NODE_ENV'
                        },
                        $default: {
                            $env: 'TOKEN_SECRET',
                            $default: 'kissmyants'
                        },
                        production: {
                            $env: 'TOKEN_SECRET'
                        }
                    },
                    jwt: {
                        useRefreshTokens: true,
                        issuer: 'Pallies',
                        accessTokenLifespan: 3600,
                        refreshTokenLifespan: 604800
                    }
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
                plugin: 'schwifty',
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
