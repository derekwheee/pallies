'use strict';

const SuccessResult = require('../dto/successResult');

module.exports = {
    method: 'GET',
    path: '/user',
    options: {
        auth: 'jwt',
        handler:  (request, h) => {

            return new SuccessResult(request.auth.credentials);
        }
    }
};
