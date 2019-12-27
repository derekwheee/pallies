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
        },
        resetPasswordPath: '/reset-password',
        noreply: 'no-reply@test.com'
    },
    smtp: {
        auth: {
            user: {
                $env: 'SMTP_USERNAME',
                $default: null
            },
            pass: {
                $env: 'SMTP_PASSWORD',
                $default: null
            }
        },
        host: {
            $env: 'SMTP_HOST',
            $default: 'smtp.ethereal.email'
        },
        port: {
            $env: 'SMTP_PORT',
            $coerce: 'number',
            $default: 587
        },
        secure: {
            $env: 'SMTP_IS_SECURE',
            $coerce: 'bool',
            $default: false
        }
    }
};
