'use strict';

const AuthService = require('../../services/auth');

const internals = {};

module.exports = {
    key: process.env.TOKEN_SECRET,
    validate: AuthService.validateToken,
    verifyOptions: { algorithms: ['HS256'] }
};
