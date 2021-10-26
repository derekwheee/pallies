'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');
const User = require('../models/user');

module.exports = [
    {
        method: 'GET',
        path: '/user',
        options: {
            auth: 'jwt',
            handler: (request, h) => {

                return request.auth.credentials.user;
            }
        }
    },
    {
        method: 'POST',
        path: '/user',
        options: {
            auth: 'jwt',
            validate: {
                payload: Joi.object({
                    user: User.joiSchema.fork('id', (s) => s.required()),
                    role: Joi.string().optional()
                })
            },
            handler: async (request, h) => {

                const { auth } = request;
                const { user } = request.payload;
                const { userService } = h.services();

                if (user.id !== auth.credentials.id) {
                    throw Boom.badRequest('Invalid user update request');
                }

                const updated = await userService.update(user);

                return updated;
            }
        }
    }
];
