'use strict';

const Pallie = require('../../models/pallie');

module.exports = {
    method: 'POST',
    path: '/register',
    options: {
        validate: {
            payload: Pallie.joiSchema.fork('password', (s) => s.required())
        },
        handler: async (request, h) => {

            const { authService, pallieService } = h.services();
            const user = request.payload;

            const results = await authService.register(user);

            return pallieService.present(results);
        }
    }
};
