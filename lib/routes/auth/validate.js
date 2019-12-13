'use strict';

module.exports = {
    method: 'GET',
    path: '/validate',
    options: {
        auth: 'jwt',
        handler: (request, h) => {

            return 'OK';
        }
    }
};
