module.exports = {


  friendlyName: 'events.messageDeleteBulk',


  description: 'Discord message delete bulk event',


  inputs: {
    messages: {
      type: 'ref',
      required: true,
      description: "A collection of messages deleted"
    }
  },

  fn: async function (inputs) {

    var data = ``;
    inputs.messages.array().sort(function (a, b) {
      return a.id - b.id;
    }).map(async (message) => {

      // Remove XP/credits
      await sails.helpers.xp.removeMessage(message);

      // Remove all good rep earned from reactions, if any.
      await sails.helpers.reputation.removeAll(message);

      // Remove all starboard
      await sails.helpers.starboard.remove(message);

      // Write each message to data
      data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}, channel ${message.channel.name}+++\n`;
      data += `-Time: ${moment(message.createdAt).format()}\n`;
      // Write attachment URLs
      message.attachments.array().map((attachment) => {
        data += `-Attachment: ${attachment.url}\n`;
      });
      // Write embeds as JSON
      message.embeds.forEach((embed) => {
        data += `-Embed: ${JSON.stringify(embed)}\n`;
      });
      // Write the clean version of the message content
      data += `${message.cleanContent}\n\n\n`;
    });

    // Create a buffer with the data
    var buffer = Buffer.from(data, "utf-8");

    // Send the buffer to the staff channel as a txt file
    await sails.helpers.guild.send('eventLogChannel', message.guild, `:wastebasket: :wastebasket: Multiple messages were deleted in bulk.`, { files: [ { attachment: buffer, name: `bulkDelete_${moment().valueOf()}.txt` } ] });
  }


};

