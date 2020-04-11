/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */

module.exports.custom = {
  discord: {
    clientOptions: { // Discord.js clientOptions. You can override in local.js
      messageCacheMaxSize: 10000,
      messageCacheLifetime: (60 * 60 * 24 * 10),
      messageSweepInterval: (60 * 60),
      fetchAllMembers: true,
      partials: [ 'USER', 'MESSAGE', 'CHANNEL', 'GUILD_MEMBER', 'REACTION' ],
    },
    defaultPrefix: `sr!`,
    token: ``, // Bot user token
    clientOwner: `` // Snowflake ID of the bot owner
  },

  baseURL: `https://example.com` // Base URL for the REST API
};
