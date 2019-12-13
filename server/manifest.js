'use strict';

const Dotenv = require('dotenv');
const Confidence = require('confidence');
const Toys = require('toys');
const Schwifty = require('schwifty');

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
                log: ['error'],
                request: ['error']
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
                    tokenSecret: {
                        $filter: { $env: 'NODE_ENV' },
                        $default: {
                            $env: 'TOKEN_SECRET',
                            $default: 'kissmyants'
                        },
                        production: {           // In production do not default to "app-secret"
                            $env: 'TOKEN_SECRET'
                        }
                    },
                    isDev: {
                        $filter: { $env: 'NODE_ENV' },
                        $default: false,
                        production: false,
                        development: true
                    },
                    jwt: {
                        userRefreshTokens: {
                            $env: 'USE_REFRESH_TOKENS',
                            $coerce: 'bool',
                            $default: true
                        },
                        issuer: {
                            $env: 'APPLICATION_NAME',
                            $default: 'Test Application'
                        }
                    },
                    application: {
                        name: {
                            $env: 'APPLICATION_NAME',
                            $default: 'Test Application'
                        },
                        uri: {
                            $env: 'APPLICATION_URI',
                            $default: 'http://localhost:3000'

                        },
                        noreply: {
                            $env: 'APPLICATION_NOREPLY',
                            $default: 'no-reply@test.com'

                        }
                    },
                    smtp: {
                        auth: {
                            user: {
                                $env: 'SMTP_USERNAME',
                                $default: null
                            },
                            pass: {
                                $env: 'SMTP_PASSWORD',
                                $default: null
                            }
                        },
                        host: {
                            $env: 'SMTP_HOST',
                            $default: 'smtp.ethereal.email'
                        },
                        port: {
                            $env: 'SMTP_PORT',
                            $coerce: 'number',
                            $default: 587
                        },
                        secure: {
                            $env: 'SMTP_IS_SECURE',
                            $coerce: 'bool',
                            $default: false
                        }
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
                                database: { $env: 'DB_DATABASE' }
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
