module.exports = {
  port: process.env.PORT || 3000,
  maxConnections: process.env.MAX_CONNECTIONS || 50,
  imageSettings: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png']
  }
};