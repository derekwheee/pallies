'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../server');
const Package = require('../package.json');
const Manifest = require('../server/manifest');

const { describe, it } = exports.lab = Lab.script();
const { expect } = Code;

describe('Deployment', () => {

    it('registers the main plugin.', async () => {

        const server = await Server.deployment();

        expect(server.registrations[Package.name]).to.exist();
    });

    it('registers the main plugin with custom manifest.', async () => {

        const manifest = Manifest.get('/');
        const config = manifest.register.plugins.find(({ plugin }) => plugin === '../lib');

        config.options.excludeRoutes = true;

        const server = await Server.deployment(false, manifest);

        expect(server.registrations[Package.name]).to.exist();
        expect(server.registrations[Package.name].options.excludeRoutes).to.be.true();
    });

    it('registers the main plugin without routes.', async () => {

        const manifest = Manifest.get('/');
        const config = manifest.register.plugins.find(({ plugin }) => plugin === '../lib');

        config.options.excludeRoutes = true;

        const server = await Server.deployment(false, manifest);

        const { result } = await server.inject({
            method: 'get',
            url: `/token`
        });

        expect(server.registrations[Package.name]).to.exist();
        expect(server.registrations[Package.name].options.excludeRoutes).to.be.true();
        expect(result.statusCode).to.equal(404);
    });
});
