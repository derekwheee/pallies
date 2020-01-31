'use strict';

const SuccessResult = require('../../dto/successResult');

module.exports = (server) => {

    return {
        method: 'GET',
        path: '/csrf',
        options: {
            handler: (request, h) => {

                const crumb = server.plugins.crumb.generate(request, h);

                return new SuccessResult(crumb);
            }
        }
    };
};
