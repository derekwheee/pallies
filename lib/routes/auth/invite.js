'use strict';

const Joi = require('joi');
const User = require('../../models/user');
const SuccessResult = require('../../dto/successResult');

module.exports = {
    method: 'POST',
    path: '/invite',
    options: {
        auth: 'jwt',
        validate: {
            payload: Joi.object({
                user: User.joiSchema.fork('password', (s) => s.optional()).keys({ role: Joi.string().optional() }),
                role: Joi.string().optional(),
                force: Joi.bool().optional()
            })
        },
        handler: async (request, h) => {

            const { authService, roleService } = h.services();
            const { user, role, force } = request.payload;

            let roleId = user.roleId;
            let roleEntity;

            if (!user.roleId && role) {
                roleEntity = await roleService.getByName(role);
                roleId = roleEntity ? roleEntity.id : null;
            }

            const results = await authService.invite({ ...user, roleId }, force);

            return new SuccessResult(results);
        }
    }
};
