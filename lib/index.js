'use strict';

const HauteCouture = require('@hapipal/haute-couture');
const Package = require('../package.json');

exports.plugin = {
    pkg: Package,
    register: async (server, options) => {

        const amendments = options.excludeRoutes ? {
            routes: {
                include: () => false
            }
        } : null;

        // Custom plugin code can go here
        await HauteCouture.compose(server, options, { amendments });
    }
};
