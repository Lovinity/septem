module.exports = {


  friendlyName: 'events.message',


  description: 'DiscordClient message event',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: 'The message object'
    }
  },


  fn: async function (inputs) {
    // Ignore own message
    if (inputs.message.author && inputs.message.author.id === DiscordClient.user.id) return;

    // Reply to DMs saying bot ignores DM messages
    if (!inputs.message.guild && inputs.message.author) {
      inputs.message.author.send(`Oh hi there! Sorry but I don't really have anything to say in DMs. Please talk to me in a guild.`);
      return;
    }

    // Update last active
    Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
      return { lastActive: moment().toISOString(true) };
    });

    // Add spam score
    await sails.helpers.spam.applyMessage(inputs.message);

    // Check for a command and execute it if found
    var prefix = inputs.message.guild.settings.prefix || sails.config.custom.discord.defaultPrefix;
    var command;
    var commandParts;

    // Is a command by a guild member who is not a bot
    if (inputs.message.content.startsWith(prefix)) {
      if (inputs.message.member && inputs.message.author && !inputs.message.author.bot) {
        commandParts = inputs.message.content.replace(prefix, '').split(" | ");
        command = commandParts[ 0 ];
        sails.log.debug(`Discord: command executed: ${command}, by ${inputs.message.author.tag}`);
        if (typeof sails.helpers.commands !== 'undefined' && typeof sails.helpers.commands[ command ] !== 'undefined') {
          commandParts[ 0 ] = inputs.message;
          try {
            await sails.helpers.commands[ command ](...commandParts);
          } catch (e) {
            await sails.helpers.events.error(e);
            inputs.message.reply(`:no_entry: ${e.message}`);
          }
        } else {
          await sails.helpers.events.warn(`Discord: command ${command} does not exist.`);
          inputs.message.reply(':x: Sorry, but that command does not exist');
        }
      }
    } else { // Not a command

      // Add XP and credits
      await sails.helpers.xp.applyMessage(inputs.message);

      // Activate reputation if the message earns 15 or more XP and is not considered spammy.
      if (inputs.message.member && inputs.message.guild.settings.repEmoji && !inputs.message.author.bot && inputs.message.XP >= 15 && inputs.message.spamScore <= inputs.message.guild.settings.antispamCooldown) {
        inputs.message.react(inputs.message.guild.settings.repEmoji);
      }
    }
  }


};

