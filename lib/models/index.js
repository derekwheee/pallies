'use strict';

const User = require('./user');
const RefreshToken = require('./refreshToken');

module.exports = (server, options) => [
    options.User || User,
    options.RefreshToken || RefreshToken
];
