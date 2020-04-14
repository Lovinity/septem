module.exports = {


  friendlyName: 'starboard.remove',


  description: 'Remove a message from the starboard channel.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message to remove from the starboard"
    }
  },


  fn: async function (inputs) {
    const { guild } = inputs.message;
    if (guild && guild.settings.starboardChannel) {

      const starChannel = inputs.message.guild.channels.resolve(inputs.message.guild.settings.starboardChannel);
      if (starChannel) {
        const fetch = await starChannel.messages.fetch({ limit: 100 });
        const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(inputs.message.id));
        if (starMsg) {
          const oldMsg = await starChannel.inputs.messages.fetch(starMsg.id).catch(() => null);
          await oldMsg.delete();
        }
      }
    }
  }


};

