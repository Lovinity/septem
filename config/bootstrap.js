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
  Caches.new('guilds', [ 'guildID' ]);
  Caches.new('ads', [ 'uid' ]);
  Caches.new('badges', [ 'uid' ]);
  Caches.new('campaigns', [ 'uid' ]);
  Caches.new('participants', [ 'uid' ]);
  Caches.new('modifiers', [ 'uid' ]);
  Caches.new('items', [ 'uid' ]);
  Caches.new('store', [ 'guildID' ]);
  Discord.Structures.extend('Guild', Guild => {
    class CoolGuild extends Guild {
      constructor(client, data) {
        super(client, data);
      }

      get settings () {
        return Caches.get('guilds').find([ this.id ]);
      }

      get ads () {
        return Caches.get('ads').collection.filter((record) => record.guildID === this.id);
      }

      get badges () {
        return Caches.get('badges').collection.filter((record) => record.guildID === this.id);
      }

      get campaigns () {
        var records = Caches.get('campaigns').collection.filter((record) => record.guildID === this.id);
        if (records) {
          records.forEach((record, index) => {
            records[ index ].participants = Caches.get('participants').collection.filter((record2) => record2.campaignID === record.id);
            if (records[ index ].participants) {
              records[ index ].participants.forEach((recordb, indexb) => {
                records[ index ].participants[ indexb ].modifiers = Caches.get('modifiers').collection.filter((record2) => record2.participantID === record.id);
              })
            }
          });
        }

        return records;
      }

      get items () {
        return Caches.get('items').collection.filter((record) => record.guildID === this.id);
      }

      get store () {
        return Caches.get('store').find([ this.id ]);
      }
    }

    return CoolGuild;
  });

  // Roles
  Caches.new('roles', [ 'roleID', 'guildID' ]);
  Discord.Structures.extend('Role', Role => {
    class CoolRole extends Role {
      constructor(client, data, guild) {
        super(client, data, guild);
      }

      get settings () {
        return Caches.get('roles').find([ this.id, this.guild.id ]);
      }
    }

    return CoolRole;
  });


  // GuildMember
  Caches.new('members', [ 'userID', 'guildID' ]);
  Caches.new('profiles', [ 'userID', 'guildID' ]);
  Caches.new('characters', [ 'uid' ]);
  Caches.new('moderation', [ 'case' ]);
  Discord.Structures.extend('GuildMember', GuildMember => {
    class CoolGuildMember extends GuildMember {
      constructor(client, data, guild) {
        super(client, data, guild);
      }

      get settings () {
        return Caches.get('members').find([ this.id, this.guild.id ]);
      }

      get profile () {
        return Caches.get('profiles').find([ this.id, this.guild.id ]);
      }

      get characters () {
        return Caches.get('characters').collection.filter((record) => record.userID === this.id && record.guildID === this.guild.id);
      }

      get moderation () {
        return Caches.get('moderation').collection.filter((record) => record.userID === this.id && record.guildID === this.guild.id);
      }
    }

    return CoolGuildMember;
  });

  // Users (MUST be included with GuildMember)
  Discord.Structures.extend('User', User => {
    class CoolUser extends User {
      constructor(client, data) {
        super(client, data);
      }

      guildSettings (guildID) {
        return Caches.get('members').find([ this.id, guildID ]);
      }

      guildProfile (guildID) {
        return Caches.get('profiles').find([ this.id, guildID ]);
      }

      guildCharacters (guildID) {
        return Caches.get('characters').collection.filter((record) => record.userID === this.id && record.guildID === guildID);
      }

      guildModeration (guildID) {
        return Caches.get('moderation').collection.filter((record) => record.userID === this.id && record.guildID === guildID);
      }
    }

    return CoolUser;
  });

  // TextChannel
  Caches.new('channels', [ 'channelID' ]);
  Discord.Structures.extend('TextChannel', TextChannel => {
    class CoolTextChannel extends TextChannel {
      constructor(guild, data) {
        super(guild, data);
      }

      get settings () {
        return Caches.get('channels').find([ this.id ]);
      }
    }

    return CoolTextChannel;
  });

  // Messages
  Discord.Structures.extend('Message', Message => {
    class CoolMessage extends Message {
      constructor(client, data, channel) {
        super(client, data, channel);

        // These values are set after handling them, not in the class
        this.prevSpamScore = 0;
        this.prevXP = 0;

        this.cachedSpamScore = null; // This should be set to null each time spam score needs re-calculated
        this.cachedXP = null; // This should be set to null each time XP needs re-calculated
      }

      get spamScore () {
        if (this.cachedSpamScore !== null)
          return this.cachedSpamScore;

        const stringSimilarity = require("string-similarity");

        if (this.type !== 'DEFAULT' || this.author.id === this.client.user.id) {
          this.cachedSpamScore = 0;
          return 0;
        }

        // Start with a base score of 2
        var score = 2;
        var scoreReasons = {};

        // Executed after everything else is scored; manages multipliers
        var afterFunction = () => {
          // Start with a spam score multiplier of 0.5
          // spam score 50% if less strict channel AND less strict role
          // Spam score 100% if less strict channel OR less strict role
          // Spam score 150% if neither less strict channel nor less strict role
          // If the member is muted, the spam score will always be 150%
          var multiplier = 0.5;

          var isMuted = (this.member && this.guild && this.guild.settings.muteRole && this.member.roles.cache.get(this.guild.settings.muteRole));

          // If this is not a less strict channel, add 0.5 to the multiplier.
          if (!this.channel.settings.antispamLessStrict)
            multiplier += 0.5;

          // If the member does not have a role defined in less strict roles, add 0.5 to the multiplier.
          if (typeof this.member !== 'undefined') {
            var lessStrict = false;
            this.member.roles.cache
              .filter((role) => {
                return role.settings.antispamLessStrict;
              })
              .each((role) => {
                lessStrict = true;
              });
            if (!lessStrict)
              multiplier += 0.5;
          }

          // Muted members always have 1.5x multiplier
          if (isMuted)
            multiplier = 1.5;

          // Text channel conflict resolution should have very strict antispam regardless of bot settings.
          if (this.channel && this.channel.settings.conflictResolution && this.channel.settings.conflictResolution.indexOf("ACTIVE") !== -1)
            multiplier = 2;

          // Flag messages with a high spam score
          var modLog = this.guild.settings.flagLogChannel;
          const _channel = this.client.channels.resolve(modLog);
          if (score > this.guild.settings.antispamCooldown) {
            if (_channel) {
              var embed = new Discord.MessageEmbed()
                .setTitle(`Flagged message`)
                .setDescription(`${this.cleanContent}`)
                .setAuthor(this.author.tag, this.author.displayAvatarURL())
                .setFooter(`Message channel **${this.channel.name}**`)
                .addField(`Total Spam Score`, `Base: ${score}; multiplier: ${multiplier}; total: ${score * multiplier}`)
                .setColor(`#ff7878`);
              for (var key in scoreReasons) {
                if (Object.prototype.hasOwnProperty.call(scoreReasons, key)) {
                  embed.addField(key, scoreReasons[ key ]);
                }
              }
              _channel.send(`:bangbang: Please review message ${this.id}; it was flagged for having a high spam score.`, { embed })
            }
          }

          score = parseInt(score * multiplier);

          sails.log.debug(`Discord Message ${this.id} spamScore: ${score}`);

          this.cachedSpamScore = score;
        }

        // Add 5 score for each mention; mention spam
        var nummentions = this.mentions.users.size + this.mentions.roles.size;
        score += (5 * nummentions);
        if (nummentions > 0) { scoreReasons[ "Mentions" ] = (nummentions * 5) }

        // Add 5 score for each embed; link/embed spam
        var numembeds = this.embeds.length;
        score += (5 * numembeds);
        if (numembeds > 0) { scoreReasons[ "Embeds" ] = (numembeds * 5) }

        // Add 10 score for each attachment; attachment spam
        var numattachments = this.attachments.size;
        score += (10 * numattachments);
        if (numattachments > 0) { scoreReasons[ "Attachments" ] = (numattachments * 10) }

        // Calculate how many seconds this message took to type based off of 7 characters per second.
        var messageTime = ((this.cleanContent ? this.cleanContent.length : 0) / 7);

        // Iterate through messages of this channel from the last 3 minutes by the same author
        var collection = this.channel.messages.cache
          .filter((message) => {
            if (message.partial || message === null || !message) return false;
            return message.id !== this.id && message.author.id === this.author.id && moment(this.createdAt).subtract(3, 'minutes').isBefore(moment(message.createdAt)) && moment(this.createdAt).isAfter(moment(message.createdAt));
          });

        collection.each((message) => {
          // If the current message was sent at a time that causes the typing speed to be more than 7 characters per second, 
          // add score for flooding / copypasting. The faster / more characters typed, the more score added.
          var timediff = moment(this.createdAt).diff(moment(message.createdAt), 'seconds');
          if (timediff <= messageTime && !this.author.bot) {
            score += parseInt((messageTime - timediff) + 1);
            scoreReasons[ "Flooding / Rapid Typing" ] = parseInt((messageTime - timediff) + 1)
          }

          // If the current message is more than 80% or more similar to the comparing message, 
          // add 1 score for every (similarity % - 80) / 2; copy/paste spam. Multiply by 1 + (0.1 * (numcharacters / 100))
          var similarity = stringSimilarity.compareTwoStrings(`${this.content || ''}${JSON.stringify(this.embeds)}${JSON.stringify(this.attachments.array())}`, `${message.content || ''}${JSON.stringify(message.embeds)}${JSON.stringify(message.attachments.array())}`);
          if (similarity >= 0.8) {
            score += parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))));
            scoreReasons[ "Copy-Pasting" ] = parseInt((10 - ((1 - similarity) * 50)) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
          }
        });

        // Score checks only if message content exists
        if (this.cleanContent && this.cleanContent.length > 0) {

          /* DISABLED; many false positives for emojis etc
          // If the message contains any off-the-wall characters, consider it spam and add 10 to the score.
          if (/[^\x20-\x7E]/g.test(this.cleanContent || '')) {
              score += 10;
              console.log(`special characters: 10`);
          }
          */

          // Count uppercase and lowercase letters
          var uppercase = this.cleanContent.replace(/[^A-Z]/g, "").length;
          var lowercase = this.cleanContent.replace(/[^a-z]/g, "").length;

          // If 50% or more of the characters are uppercase, consider it shout spam,
          // and add a score of 5, plus 1 for every 12.5 uppercase characters.
          if (uppercase >= lowercase) {
            score += parseInt(5 + (20 * (uppercase / 250)));
            scoreReasons[ "Uppercase / Shouting" ] = parseInt(5 + (20 * (uppercase / 250)))
          }

          // Add score for repeating consecutive characters
          // 20 or more consecutive repeating characters = extremely spammy. Add 20 score.
          if (/(.)\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 20;
            scoreReasons[ "Repeating Characters" ] = 20
            // 10 or more consecutive repeating characters = spammy. Add 10 score.
          } else if (/(.)\1\1\1\1\1\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 10;
            scoreReasons[ "Repeating Characters" ] = 10
            // 5 or more consecutive repeating characters = a little bit spammy. Add 5 score.
          } else if (/(.)\1\1\1\1\1/.test(this.cleanContent.toLowerCase())) {
            score += 5;
            scoreReasons[ "Repeating Characters" ] = 5
          }

          // Add 40 score for here and everyone mentions as these are VERY spammy.
          if (this.content.includes("@here") || this.content.includes("@everyone")) {
            score += 40;
            scoreReasons[ "Here / Everyone Mention" ] = 40
          }

          // Add spam score for every new line; but the more content : new lines, the less spam score is added.
          // New lines when content length is 128 characters or less are considered very spammy.
          var newlines = this.cleanContent.split(/\r\n|\r|\n/).length - 1;
          var ratio = newlines / (this.cleanContent.length > 128 ? Math.ceil(this.cleanContent.length / 128) / 2 : 0.25);
          score += Math.round(ratio);
          if (newlines > 0 && ratio > 0) { scoreReasons[ "New Lines / Scrolling" ] = Math.round(ratio) }

          // Add score for repeating patterns
          // TODO: improve this algorithm
          var newstring = this.cleanContent;
          var regex = /(\W|^)(.+)\s\2/gmi;
          var matcher = regex.exec(this.cleanContent);
          while (matcher !== null) {
            newstring = newstring.replace(matcher[ 2 ], ``);
            matcher = regex.exec(this.cleanContent);
          }
          var patternScore = (this.cleanContent.length > 0 ? (newstring.length / this.cleanContent.length) : 1);

          // Pattern score of 100% means no repeating patterns. For every 4% less than 100%, add 1 score. Multiply depending on content length.
          score += parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0))))
          if (patternScore < 1) { scoreReasons[ "Repeating Patterns" ] = parseInt(((1 - patternScore) * 25) * (1 + (0.1 * (this.cleanContent ? this.cleanContent.length / 100 : 0)))) }

          // Add 3 points for every profane word used; excessive profanity spam
          sails.config.custom.discord.profanity.map((word) => {
            var numbers = getIndicesOf(word, this.cleanContent, false);
            if (numbers.length > 0) {
              score += (numbers.length * 3);
              if (typeof scoreReasons[ "Profanity" ] === `undefined`)
                scoreReasons[ "Profanity" ] = 0
              scoreReasons[ "Profanity" ] += (numbers.length * 3);
              //console.log(`profanity`);
            }
          });

          afterFunction()
          return score;
        } else {
          afterFunction()
          return score;
        }
      }

      get XP () { // Also used for determining credits
        if (this.cachedXP !== null)
          return this.cachedXP;

        var score = 0;

        // No XP if the channel is set to no XP earning
        if (this.channel && !this.channel.settings.earnXP) {
          this.cachedXP = 0;
          return 0;
        }

        // No XP if the member is muted
        var isMuted = (this.member && this.guild && this.guild.settings.muteRole && this.member.roles.cache.get(this.guild.settings.muteRole));
        if (isMuted) {
          this.cachedXP = 0;
          return 0;
        }

        // Add 1 XP for every 10 characters
        if (this.content) {
          score += Math.ceil(this.content.length / 10);
        }

        // Add 5 XP for every embed. NOTE: Embeds for links are not registered until Discord does a message edit.
        score += (this.embeds.length * 5);

        // Add 15 XP for every attachment
        score += (this.attachments.size * 15);

        this.cachedXP = score;
        sails.log.debug(`Discord Message ${this.id} XP: ${score}`);
        return score;
      }
    }

    return CoolMessage;
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
  await sails.models.schedules.findOrCreate({ uid: 'SYS-MINUTELY' }, { uid: 'SYS-MINUTELY', task: 'sysMinutely', cron: '* * * * *' });
  var records = await sails.models.schedules.find();
  records.forEach(async (record) => {
    Schedules[ record.id ] = await sails.helpers.schedules.add(record);
  });

};

function getIndicesOf (searchStr, str, caseSensitive) {
  var searchStrLen = searchStr.length;
  if (searchStrLen == 0) {
    return [];
  }
  var startIndex = 0, index, indices = [];
  if (!caseSensitive) {
    str = str.toLowerCase();
    searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;
  }
  return indices;
}