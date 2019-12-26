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
* Supports Postgres (more DB integration coming soon)

### Getting Started

> This guide assumes you've already created a hapi project from scratch, or using hpal

Install the Pallies module from npm:
```bash
npm install --save pallies
```