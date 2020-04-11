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

    // Check for a command
  }


};

