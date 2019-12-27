'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../server');
const Bind = require('../lib/bind');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const internals = {};

describe('Bind', () => {

    before(async () => {

        internals.server = await Server.deployment();
    });

    it('bind transaction', () => {

        const res = Bind(internals.server);

        expect(res).to.not.be.undefined();
        expect('transaction' in res).to.be.true();
        expect(typeof res.transaction).to.equal('function');
    });

    after(async () => {

    });
});
