'use strict';

const User = require('./user');
const RefreshToken = require('./refreshToken');
const Role = require('./role');

module.exports = (server, options = {}) => [
    options.User || User,
    options.RefreshToken || RefreshToken,
    options.Role || Role
];
