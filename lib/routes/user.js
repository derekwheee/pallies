'use strict';

const Joi = require('@hapi/joi');
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

                return new SuccessResult(request.auth.credentials.user);
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
                const { user, role } = request.payload;
                const { userService, roleService } = h.services();

                if (user.id !== auth.credentials.id) {
                    return Boom.badRequest('Invalid user update request');
                }

                let roleId = user.roleId;
                let roleEntity;

                if (!user.roleId && role) {
                    roleEntity = await roleService.getByName(role);
                    roleId = roleEntity ? roleEntity.id : null;
                }

                const updated = await userService.update({ ...user, roleId });

                return new SuccessResult(updated);
            }
        }
    }
];
