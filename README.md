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

This guide assumes you've already created a hapi project from scratch, or using hpal

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
const Config = require('./.palliesrc');

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
        ...Config.pallies
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
            knex: Config.knex
        },
        production: {
            migrateOnStart: false
        }
    }
}
```


#### Apply database migrations
```bash
npx knex-migrate up --cwd ./node_modules/pallies
```