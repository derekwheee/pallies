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

            const AuthService = h.services().authService;
            const user = request.payload;

            return await AuthService.register(user);
        }
    }
};
