module.exports = {
    tokenSecret: {
        $filter: {
            $env: 'NODE_ENV'
        },
        $default: {
            $env: 'TOKEN_SECRET',
            $default: 'kissmyants'
        },
        production: {
            $env: 'TOKEN_SECRET'
        }
    },
    isDev: {
        $filter: {
            $env: 'NODE_ENV'
        },
        $default: true,
        production: false,
        development: true
    },
    requireSSL: {
        $filter: {
            $env: 'NODE_ENV'
        },
        $default: true,
        production: true,
        development: false,
        test: false
    },
    useCSRFTokens: {
        $filter: {
            $env: 'NODE_ENV'
        },
        $default: true,
        production: true,
        development: true,
        test: false
    },
    jwt: {
        useRefreshTokens: true,
        issuer: 'Pallies',
        accessTokenLifespan: 3600,
        refreshTokenLifespan: 604800
    },
    application: {
        name: 'Pallies',
        uri: {
            $filter: {
                $env: 'NODE_ENV'
            },
            $default: 'http://localhost:3001',
            production: '',
            development: 'http://localhost:3001'
        }
    }
};
