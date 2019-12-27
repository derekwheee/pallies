'use strict';

/**
 * @class SuccessResult
 */
class SuccessResult {

    /**
     * Creates an instance of SuccessResult.
     * @param {object} [data={}] - The data to be return from the API
     * @param {number} [statusCode=200] - The HTTP status code to be returned
     * @returns {object}
     */
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
}

module.exports = SuccessResult;
