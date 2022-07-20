'use strict';

const User = require('../../models/user');

module.exports = {
    method: 'POST',
    path: '/register',
    options: {
        validate: {
            payload: User.joiSchema
        },
        handler: async (request, h) => {

            const { authService, userService } = h.services();
            const user = request.payload;

            const results = await authService.register(user);

            return userService.present(results);
        }
    }
};
