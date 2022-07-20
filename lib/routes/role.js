'use strict';

const Joi = require('joi');
const Role = require('../models/role');

module.exports = [
    {
        method: 'PUT',
        path: '/role',
        options: {
            auth: 'jwt',
            validate: {
                payload: Role.joiSchema
            },
            handler: async (request, h) => {

                const { roleService } = h.services();

                const role = await roleService.create(request.payload.name);

                return roleService.present(role);
            }
        }
    },
    {
        method: 'GET',
        path: '/role',
        options: {
            auth: 'jwt',
            validate: {
                query: Joi.object({
                    name: Joi.string(),
                    id: Joi.number()
                }).xor('name', 'id')
            },
            handler: async (request, h) => {

                const { roleService } = h.services();
                const { id, name } = request.query;
                let role;

                if (name) {
                    role = await roleService.getByName(name);
                }
                else {
                    role = await roleService.getById(id);
                }

                return roleService.present(role);
            }
        }
    },
    {
        method: 'POST',
        path: '/role',
        options: {
            auth: 'jwt',
            validate: {
                payload: Role.joiSchema
            },
            handler: async (request, h) => {

                const { roleService } = h.services();

                const role = await roleService.update(request.payload);

                return roleService.present(role);
            }
        }
    },
    {
        method: 'DELETE',
        path: '/role',
        options: {
            auth: 'jwt',
            validate: {
                query: Joi.object({
                    id: Joi.number()
                })
            },
            handler: async (request, h) => {

                const { roleService } = h.services();

                await roleService.delete(request.query.id);

                return h.response().code(204);
            }
        }
    }
];
