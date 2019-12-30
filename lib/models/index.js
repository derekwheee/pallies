'use strict';

const User = require('./User');
const RefreshToken = require('./RefreshToken');

module.exports = (server, options) => [
    options.User || User,
    options.RefreshToken || RefreshToken
];
