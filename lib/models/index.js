'use strict';

const User = require('./user');
const RefreshToken = require('./refresh-token');

module.exports = (_, options = {}) => [
    options.User || User,
    options.RefreshToken || RefreshToken
];
