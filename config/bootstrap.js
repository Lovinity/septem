/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

// Globals
global[ 'moment' ] = require('moment');
global[ 'ModelCache' ] = {};

module.exports.bootstrap = async function () {

  /*
      Initialize CACHE
  */
  var records = await sails.models.schedules.find();
  ModelCache.schedules = {};
  records.forEach(async (record) => {
    ModelCache.schedules[ record.ID ] = record;
  });


  /*
  *    DISCORD
  */

  // Load Discord globals and initialize Discord client
  global[ 'Discord' ] = require('discord.js');
  global[ 'DiscordClient' ] = new Discord.Client(sails.config.custom.discord.clientOptions);

  // Initialize DiscordClient event handlers
  if (sails.helpers.events) {
    for (var event in sails.helpers.events) {
      if (Object.prototype.hasOwnProperty.call(sails.helpers.events, event)) {
        DiscordClient.on(event, async (...args) => {
          await sails.helpers.events[ event ](...args);
        })
      }
    }
  }

  // Start the Discord bot
  DiscordClient.login(sails.config.custom.discord.token);

  /*
      SCHEDULES
  */

  // Initialize cron schedules
  ModelCache.scheduleCrons = {};
  for (var record in ModelCache.schedules) {
    if (Object.prototype.hasOwnProperty.call(ModelCache.schedules, record)) {
      await sails.helpers.schedules.add(ModelCache.schedules[ record ]);
    }
  }

};
