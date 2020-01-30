'use strict';

module.exports = (_server, options) => {

    return {
        plugins: {
            options: {
                restful: true,
                cookieOptions: {
                    isSecure: options.hasOwnProperty('isDev') ? options.isDev : true
                },
                skip: () => !options.useCSRFTokens || process.env.NODE_ENV === 'test'
            }
        }
    };
};
