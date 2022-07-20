'use strict';

const Pallie = require('./pallie');
const RefreshToken = require('./refreshToken');
const Role = require('./role');

module.exports = (server, options = {}) => [
    options.Pallie || Pallie,
    options.RefreshToken || RefreshToken,
    options.Role || Role
];
