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

        if (typeof data !== 'object') {
            return {
                statusCode,
                data
            };
        }

        if (data.isBoom) {
            return data;
        }

        // We never want to send passwords in payloads
        delete data.password;

        // We never want to send refresh tokens in payloads
        delete data.refreshToken;

        return {
            statusCode,
            data
        };
    }
}

module.exports = SuccessResult;
