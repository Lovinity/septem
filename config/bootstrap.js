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
global[ 'Discord' ] = require('discord.js');
global[ 'moment' ] = require('moment');
var CacheManager = require('../util/Cache');
global[ 'Caches' ] = new CacheManager();
global[ 'Schedules' ] = {};

module.exports.bootstrap = async function () {

  /*
      DISCORD Discord.Structures AND CACHES
      These must be extended before the client is initialized
  */

  // Guild
  Caches.new('guildSettings', 'guilds', 'guildID');
  Caches.new('ads', 'ads', 'guildID', false);
  Caches.new('badges', 'badges', 'guildID', false);
  Caches.new('campaigns', 'campaigns', 'guildID', false);
  Caches.new('campaignParticipants', 'participants', 'campaignID', false);
  Caches.new('campaignParticipantModifiers', 'modifiers', 'participantID', false);
  Caches.new('items', 'items', 'guildID', false);
  Discord.Structures.extend('Guild', Guild => {
    class CoolGuild extends Guild {
      constructor(client, data) {
        super(client, data);
      }

      get settings () {
        var settings = Caches.get('guildSettings', this.id);
        if (!settings) {
          sails.models.guilds.findOrCreate({ guildID: this.id }, { guildID: this.id }).exec(() => { });
          return makeDefault(sails.models.guilds.attributes, { guildID: this.id });
        } else {
          return settings;
        }
      }

      get ads () {
        return Caches.get('ads', this.id, (record) => record.guildID === this.id);
      }

      get badges () {
        return Caches.get('badges', this.id, (record) => record.guildID === this.id);
      }

      get campaigns () {
        var records = Caches.get('campaigns', this.id, (record) => record.guildID === this.id);
        if (records) {
          records.forEach((record, index) => {
            records[ index ].participants = Caches.get('campaignParticipants', record.id);
            if (records[ index ].participants) {
              records[ index ].participants.forEach((recordb, indexb) => {
                records[ index ].participants[ indexb ].modifiers = Caches.get('campaignParticipantModifiers', recordb.id);
              })
            }
          });
        }

        return records;
      }

      get items () {
        return Caches.get('items', this.id, (record) => record.guildID === this.id);
      }
    }

    return CoolGuild;
  });

  // Users (MUST be included with GuildMember)
  Discord.Structures.extend('User', User => {
    class CoolUser extends User {
      constructor(client, data) {
        super(client, data);
      }

      guildSettings (guildID) {
        var settings = (Caches.get('memberSettings', this.id, (record) => record.guildID === guildID) || [ {} ])[ 0 ];
        if (!settings) {
          sails.models.members.findOrCreate({ userID: this.id, guildID: guildID }, { userID: this.id, guildID: guildID }).exec(() => { });
          return makeDefault(sails.models.members.attributes, { userID: this.id, guildID: guildID });
        } else {
          return settings;
        }
      }

      guildProfile (guildID) {
        var settings = (Caches.get('memberProfiles', this.id, (record) => record.guildID === guildID) || [ {} ])[ 0 ];
        if (!settings) {
          sails.models.profiles.findOrCreate({ userID: this.id, guildID: guildID }, { userID: this.id, guildID: guildID }).exec(() => { });
          return makeDefault(sails.models.profiles.attributes, { userID: this.id, guildID: guildID });
        } else {
          return settings;
        }
      }

      guildCharacters (guildID) {
        return Caches.get('memberCharacters', this.id, (record) => record.guildID === guildID);
      }
    }

    return CoolUser;
  });

  // GuildMember
  Caches.new('memberSettings', 'members', 'userID', false);
  Caches.new('memberProfiles', 'profiles', 'userID', false);
  Caches.new('memberCharacters', 'characters', 'userID', false);
  Discord.Structures.extend('GuildMember', GuildMember => {
    class CoolGuildMember extends GuildMember {
      constructor(client, data, guild) {
        super(client, data, guild);
      }

      get settings () {
        var settings = (Caches.get('memberSettings', this.id, (record) => record.guildID === this.guild.id) || [ {} ])[ 0 ];
        if (!settings) {
          sails.models.members.findOrCreate({ userID: this.id, guildID: this.guild.id }, { userID: this.id, guildID: this.guild.id }).exec(() => { });
          return makeDefault(sails.models.members.attributes, { userID: this.id, guildID: this.guild.id });
        } else {
          return settings;
        }
      }

      get profile () {
        var settings = (Caches.get('memberProfiles', this.id, (record) => record.guildID === this.guild.id) || [ {} ])[ 0 ];
        if (!settings) {
          sails.models.profiles.findOrCreate({ userID: this.id, guildID: this.guild.id }, { userID: this.id, guildID: this.guild.id }).exec(() => { });
          return makeDefault(sails.models.profiles.attributes, { userID: this.id, guildID: this.guild.id });
        } else {
          return settings;
        }
      }

      get characters () {
        return Caches.get('memberCharacters', this.id, (record) => record.guildID === this.guild.id);
      }
    }

    return CoolGuildMember;
  });

  // TextChannel
  Caches.new('channelSettings', 'channels', 'channelID');
  Discord.Structures.extend('TextChannel', TextChannel => {
    class CoolTextChannel extends TextChannel {
      constructor(guild, data) {
        super(guild, data);
      }

      get settings () {
        var settings = Caches.get('channelSettings', this.id);
        if (!settings) {
          sails.models.channels.findOrCreate({ channelID: this.id }, { channelID: this.id, guildID: this.guild.id }).exec(() => { });
          return makeDefault(sails.models.channels.attributes, { channelID: this.id, guildID: this.guild.id });
        } else {
          return settings;
        }
      }
    }

    return CoolTextChannel;
  });

  /*
      DISCORD
  */

  // Load Discord globals and initialize Discord client
  Discord.DiscordMenu = require('../util/DiscordMenu');
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
      INITIALIZE SCHEDULES
  */

  // Initialize cron schedules
  var records = await sails.models.schedules.find();
  records.forEach(async (record) => {
    Schedules[ record.id ] = await sails.helpers.schedules.add(record);
  });

};

// Sync helper for developing and returning a default record when creating a new one in the database. 
function makeDefault (attributes, defaults = {}) {
  var temp = {};
  for (var key in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      temp[ key ] = (typeof defaults[ key ] !== 'undefined') ? (defaults[ key ]) : (typeof attributes[ key ].defaultsTo !== 'undefined') ? attributes[ key ].defaultsTo : null;
    }
  }
  return temp;
}