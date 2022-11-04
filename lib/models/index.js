'use strict';

const Pallie = require('./pallie');
const RefreshToken = require('./refreshToken');

module.exports = (server, options = {}) => [
    options.Pallie || Pallie,
    options.RefreshToken || RefreshToken
];
