'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');
const Pallie = require('../models/pallie');

module.exports = [
    {
        method: 'GET',
        path: '/pallie',
        options: {
            auth: 'jwt',
            handler: (request, h) => {

                const { pallieService } = h.services();

                return pallieService.present(request.auth.credentials.pallie);
            }
        }
    },
    {
        method: 'POST',
        path: '/pallie',
        options: {
            auth: 'jwt',
            validate: {
                payload: Joi.object({
                    user: Pallie.joiSchema.fork('id', (s) => s.required())
                })
            },
            handler: async (request, h) => {

                const { auth } = request;
                const { user } = request.payload;
                const { pallieService } = h.services();

                if (user.id !== auth.credentials.id) {
                    throw Boom.badRequest('Invalid user update request');
                }

                const updated = await pallieService.update(user);

                return pallieService.present(updated);
            }
        }
    }
];
