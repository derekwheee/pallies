'use strict';

const Joi = require('@hapi/joi');
const Role = require('../models/role');
const SuccessResult = require('../dto/successResult');

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

                return new SuccessResult(role);
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

                return new SuccessResult(role);
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

                return new SuccessResult(role);
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

                return new SuccessResult();
            }
        }
    }
];
