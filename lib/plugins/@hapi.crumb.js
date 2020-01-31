'use strict';

module.exports = (server, options) => {

    return {
        plugins: {
            options: {
                restful: true,
                cookieOptions: {
                    isSecure: options.hasOwnProperty('isDev') ? options.isDev : true
                },
                skip: () => !options.useCSRFTokens
            }
        }
    };
};
