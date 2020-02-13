'use strict';

const User = require('../../models/user');
const SuccessResult = require('../../dto/successResult');

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

            const results = await AuthService.register(user);

            return new SuccessResult(results);
        }
    }
};
