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

    // TODO: Check for a command
    var prefix = ModelCache.guilds[ inputs.message.guild.id ].prefix || sails.config.custom.discord.defaultPrefix;
    var command;
    var commandParts;
    if (inputs.message.content.startsWith(prefix)) {
      commandParts = inputs.message.content.replace(prefix, '').split(" | ");
      command = commandParts[ 0 ];
      if (typeof sails.helpers.commands !== 'undefined' && typeof sails.helpers.commands[ command ] !== 'undefined') {
        commandParts = commandParts.splice(0, 1);
        inputs.message.reply(await sails.helpers.commands[ command ](...commandParts));
      } else {
        inputs.message.reply(':x: Sorry, but that command does not exist');
      }
    }
  }


};

