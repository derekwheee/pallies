'use strict';

module.exports = class SuccessResult {

    constructor(data = {}, statusCode = 200) {

        // Prevent passwords being transmitted
        if ('password' in data) {
            delete data.password;
        }

        if ('isBoom' in data && data.isBoom) {
            return data;
        }

        return {
            statusCode,
            data
        };
    }
};

