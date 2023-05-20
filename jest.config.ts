/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
 verbose: true,
 testEnvironment: 'node',
 testMatch: ['**/tests/**/*.test.js'],
});
