'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Constants = require('../constants');
const SuccessResult = require('../../lib/dto/successResult');

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;

describe('Success Result', () => {

    it('has correct structure', () => {

        const result = new SuccessResult({ identifier: Constants.TEST_USER_EMAIL });

        expect(result.hasOwnProperty('statusCode')).to.be.true();
        expect(result.hasOwnProperty('data')).to.be.true();
        expect(result.data.hasOwnProperty('identifier')).to.be.true();
        expect(result.data.identifier).to.equal(Constants.TEST_USER_EMAIL);
    });

    it('has correct structure: string edition', () => {

        const dataString = 'stringy data';
        const result = new SuccessResult(dataString);

        expect(result.hasOwnProperty('statusCode')).to.be.true();
        expect(result.hasOwnProperty('data')).to.be.true();
        expect(result.data).to.equal(dataString);
    });

    it('returns error', () => {

        const result = new SuccessResult({ isBoom: true });

        expect(result.hasOwnProperty('statusCode')).to.be.false();
        expect(result.hasOwnProperty('data')).to.be.false();
        expect(result.isBoom).to.be.true();
    });

    it('removes password', () => {

        const result = new SuccessResult({ password: Constants.TEST_USER_PASSWORD });

        expect(result.data.hasOwnProperty('password')).to.be.false();
    });

    it('removes refresh token', () => {

        const result = new SuccessResult({ refreshToken: 'thisisarefreshtoken' });

        expect(result.data.hasOwnProperty('refreshToken')).to.be.false();
    });
});
