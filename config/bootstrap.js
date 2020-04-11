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
      Load data into cache
  */

  // schedules
  var records = await sails.models.schedules.find();
  ModelCache.schedules = {};
  records.forEach(async (record) => {
    ModelCache.schedules[ record.uid ] = record;
  });
  // Create a guild task schedule to run on all guilds every minute if it does not already exist
  if (sails.helpers.tasks && sails.helpers.tasks.guild) {
    await sails.models.schedules.findOrCreate({ uid: 'SYS-TASK', task: 'guild' }, { uid: 'SYS-TASK', task: 'guild', cron: '* * * * *' });
  }

  // guilds
  var records = await sails.models.guilds.find();
  ModelCache.guilds = {};
  records.forEach(async (record) => {
    ModelCache.guilds[ record.guildID ] = record;
  });

  // channels
  var records = await sails.models.channels.find();
  ModelCache.channels = {};
  records.forEach(async (record) => {
    ModelCache.channels[ record.channelID ] = record;
  });

  // roles
  var records = await sails.models.roles.find();
  ModelCache.roles = {};
  records.forEach(async (record) => {
    if (typeof ModelCache.guilds[ record.guildID ].roles === 'undefined') {
      ModelCache.guilds[ record.guildID ].roles = {};
    }
    ModelCache.guilds[ record.guildID ].roles[ record.roleID ] = record;
  });

  // store
  var records = await sails.models.store.find();
  ModelCache.store = {};
  records.forEach(async (record) => {
    ModelCache.store[ record.guildID ] = record;
  });

  // Ads
  var records = await sails.models.ads.find();
  ModelCache.ads = {};
  records.forEach(async (record) => {
    if (typeof ModelCache.guilds[ record.guildID ].ads === 'undefined') {
      ModelCache.guilds[ record.guildID ].ads = {};
    }
    ModelCache.guilds[ record.guildID ].ads[ record.uid ] = record;
  });

  // badges
  var records = await sails.models.badges.find();
  ModelCache.badges = {};
  records.forEach(async (record) => {
    if (typeof ModelCache.guilds[ record.guildID ].badges === 'undefined') {
      ModelCache.guilds[ record.guildID ].badges = {};
    }
    ModelCache.guilds[ record.guildID ].badges[ record.uid ] = record;
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

        // Needs to be in a self-calling function to provide the proper value of event
        (async (event2) => {
          if ([ 'ready' ].indexOf(event2) !== -1) {
            DiscordClient.once(event2, async (...args) => {
              await sails.helpers.events[ event2 ](...args);
            })
          } else {
            DiscordClient.on(event2, async (...args) => {
              await sails.helpers.events[ event2 ](...args);
            })
          }
        })(event);

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
