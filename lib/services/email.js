'use strict';

const Schmervice = require('schmervice');
const Nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const InviteTemplate = require('../assets/templates/invite');

const internals = {};

module.exports = class EmailService extends Schmervice.Service {

    async initialize() {

        if (this.options.isDev) {
            internals.smtp = {
                auth: await Nodemailer.createTestAccount(),
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false
            };
        }
        else {
            internals.smtp = this.options.smtp;
        }

        internals.transporter = Nodemailer.createTransport(internals.smtp);
    }

    async sendUserInvite(clientId, from, name, email, tokens) {

        const html = Handlebars.compile(InviteTemplate)({
            applicationName: this.options.application.name,
            inviter: from,
            inviteUrl: `${this.options.application.uri}/?access_token=${tokens.access_token}`
        });

        await internals.transporter.sendMail({
            from: `"${this.options.application.name}" <${this.options.application.noreply}>`,
            to: `"${name}" <${email}>`,
            subject: `Here\'s your invite from ${this.options.application.name}`,
            text: `To log in and reset your password go to ${this.options.application.uri}/?access_token=${tokens.access_token}`,
            html
        });
    }
};
