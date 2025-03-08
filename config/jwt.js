module.exports = {
    secret: process.env.JWT_SECRET || 'your-dev-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-dev-secret',
    tokenExpiration: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  };