'use strict';

const Schmervice = require('schmervice');
const Nodemailer = require('nodemailer');
const Handlebars = require('handlebars');
const Hashids = require('hashids/cjs');
const InviteTemplate = require('../assets/templates/invite');
const ForgotPasswordTemplate = require('../assets/templates/forgotPassword');

const hashids = new Hashids('SALTY LAD', 16);
const internals = {};

/**
 * @class EmailService
 */
class EmailService extends Schmervice.Service {

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

    /**
    * Send a user invite email
    * @async
    * @param {string} from - The name of the user sending the invite
    * @param {User} user - The user object for the new user
    * @returns {object} A Nodemailer mail object
    */
    async sendUserInvite(from, user) {

        if (!user.forgotPasswordToken) {
            throw new Error('Invalid invite token');
        }

        const config = {
            applicationName: this.options.application.name,
            inviter: from,
            inviteUrl: `${this.options.application.uri}${this.options.application.resetPasswordPath}/?token=${user.forgotPasswordToken}&uid=${hashids.encode(user.id)}`
        };

        const html = Handlebars.compile(InviteTemplate)(config);

        const mail = await internals.transporter.sendMail({
            from: `"${this.options.application.name}" <${this.options.application.noreply}>`,
            to: `"${user.name}" <${user.email}>`,
            subject: `Here\'s your invite from ${this.options.application.name}`,
            text: `To log in and reset your password go to ${config.inviteUrl}`,
            html
        });

        if (this.options.isDev) {
            console.log(`Preview URL: ${Nodemailer.getTestMessageUrl(mail)}`);
        }

        return mail;
    }

    /**
    * Send a forgot password email
    * @async
    * @param {User} user - The user object for user who forgot their password
    * @returns {object} A Nodemailer mail object
    */
    async sendForgotPassword(user) {

        if (!user.forgotPasswordToken) {
            throw new Error('Invalid forgot password token');
        }

        const config = {
            passwordResetUrl: `${this.options.application.uri}${this.options.application.resetPasswordPath}/?token=${user.forgotPasswordToken}&uid=${hashids.encode(user.id)}`
        };

        const html = Handlebars.compile(ForgotPasswordTemplate)(config);

        const mail = await internals.transporter.sendMail({
            from: `"${this.options.application.name}" <${this.options.application.noreply}>`,
            to: `"${user.name}" <${user.email}>`,
            subject: `Forgot password for ${user.name}`,
            text: `To log in and reset your password go to ${config.passwordResetUrl}`,
            html
        });

        if (this.options.isDev) {
            console.log(`Preview URL: ${Nodemailer.getTestMessageUrl(mail)}`);
        }

        return mail;
    }
}

module.exports = EmailService;
