# Pallies 

[![Build Status](https://travis-ci.org/frxnz/pallies.svg?branch=master)](https://travis-ci.org/frxnz/pallies)
[![Coverage Status](https://coveralls.io/repos/github/frxnz/pallies/badge.svg?branch=master)](https://coveralls.io/github/frxnz/pallies?branch=master)

Pallies is a user management plugin for [hapi](https://hapi.dev/), designed to work best with
[hapipal](https://github.com/hapipal).



### Resources
* [API documentation](https://frxnz.github.io/pallies/)

### Features
* Supports hapi v18+
* Built-in support for user invite and forgot password emails
* Powerful configuration using [Confidence](https://github.com/hapijs/confidence)
* Strong password encryption using [Argon2](https://www.npmjs.com/package/argon2)
* Use any database supported by [Knex](http://knexjs.org/) and [Objection](https://vincit.github.io/objection.js/)

### Getting Started

This guide assumes you've already created a hapi project using hpal

Looking for a starting point? Check the [Pallies Demo Repo](https://github.com/frxnz/pallies-demo-api).

#### Install the Pallies module from npm
```bash
npm install --save pallies
```

#### Configure Pallies
Create a configuration file at `server/.palliesrc.js`

[Example Pallies configuration](https://github.com/frxnz/pallies/blob/master/server/.palliesrc.js)

#### Update Your Manifest
```js
// Load Pallies config
const PalliesConfig = require('./.palliesrc');

// Register Pallies as a plugin
{
    plugin: 'pallies',
    options: {
        isDev: {
            $filter: {
                $env: 'NODE_ENV'
            },
            $default: false,
            production: false,
            development: true
        },
        ...PalliesConfig
    }
},
// Register Schwifty
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
                    stub: 'Schwifty.migrationsStubPath'
                }
            }
        },
        production: {
            migrateOnStart: false
        }
    }
}
```

#### Update `knexfile.js`

Add the Pallies migration directory to your migrations configuration

```js
// ...
migrations: {
    directory: [
        'node_modules/pallies/lib/migrations',
        Path.relative(process.cwd(), PluginConfig.migrationsDir)
    ]
}
//...
```

#### Apply database migrations
```bash
npx knex migrate:latest
```