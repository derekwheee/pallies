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
                force: Joi.bool().optional()
            })
        },
        handler: async (request, h) => {

            const { authService } = h.services();
            const { user, force } = request.payload;

            const results = await authService.invite(user, force);

            return new SuccessResult(results);
        }
    }
};
