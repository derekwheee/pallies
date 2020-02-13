'use strict';

const Boom = require('@hapi/boom');
const User = require('../models/user');
const SuccessResult = require('../dto/successResult');

module.exports = [
    {
        method: 'GET',
        path: '/user',
        options: {
            auth: 'jwt',
            handler: (request, h) => {

                return new SuccessResult(request.auth.credentials);
            }
        }
    },
    {
        method: 'POST',
        path: '/user',
        options: {
            auth: 'jwt',
            validate: {
                payload: User.joiSchema.fork('id', (s) => s.required())
            },
            handler: async (request, h) => {

                const { payload, auth } = request;
                const { userService } = h.services();

                if (payload.id !== auth.credentials.id) {
                    return Boom.badRequest('Invalid user update request');
                }

                const updated = await userService.update(request.payload);

                return new SuccessResult(updated);
            }
        }
    }
];
