module.exports = {


  friendlyName: 'event.channelDelete',


  description: 'Discord channel delete event',


  inputs: {
    channel: {
      type: 'ref',
      required: true,
      description: 'The channel that was deleted.'
    }
  },


  fn: async function (inputs) {

    // If the channel is a partial, we can't do anything. Tell the owner.
    if (inputs.channel.partial) {
      const owner = DiscordClient.application.owner;
      if (owner) {
        owner.send(`:question: Partial channel ${inputs.channel.id} was deleted.`);
      }
      return;
    }

    // Find out who deleted the channel
    const fetchedLogs = await inputs.channel.guild.fetchAuditLogs({
      limit: 1,
      type: 'CHANNEL_DELETE',
    });
    var auditLog = fetchedLogs.entries.first();
    if (!auditLog || auditLog.target.id !== inputs.channel.id)
      auditLog = undefined;

    if (inputs.channel.guild && inputs.channel.type === 'text') {

      // Initiate data variable
      var data = `ARCHIVE (max 1,000 messages / 10 days old) of deleted text channel ${inputs.channel.name}, ID ${inputs.channel.id}\nCreated on ${moment(inputs.channel.createdAt).format()}\nDeleted on ${moment().format()}\n\n`;

      // Iterate through the messages, sorting by ID, and add them to data
      var messages = inputs.channel.messages.cache;
      messages.array().sort(function (a, b) {
        return a.id - b.id;
      }).map((message) => {
        // Write each message to data
        data += `+++Message by ${message.author.username}#${message.author.discriminator} (${message.author.id}), ID ${message.id}+++\n`;
        data += `-Time: ${moment(message.createdAt).format()}\n`;
        // Write attachment URLs
        message.attachments.array().map((attachment) => {
          data += `-Attachment: ${attachment.url}\n`;
        });
        // Write embeds as JSON
        message.embeds.map((embed) => {
          data += `-Embed: ${JSON.stringify(embed)}\n`;
        });
        // Write the clean version of the message content
        data += `${message.cleanContent}\n\n\n`;
      });

      // Create a buffer with the data
      var buffer = new Buffer(data, "utf-8");

      // Send the buffer to the staff channel as a txt file
      await sails.helpers.guild.send('eventLogChannel', inputs.channel.guild, `:speech_left: :wastebasket: The channel ${inputs.channel.name} (${inputs.channel.id}) was deleted${auditLog ? ` by ${auditLog.executor.tag} (${auditLog.executor.id})` : ``}.`, { files: [ { attachment: buffer, name: `${channel.name}.txt` } ] });
    } else if (inputs.channel.guild) {
      await sails.helpers.guild.send('eventLogChannel', inputs.channel.guild, `:speech_left: :wastebasket: The ${inputs.channel.type} channel ${inputs.channel.name} (${inputs.channel.id}) was deleted${auditLog ? ` by ${auditLog.executor.tag} (${auditLog.executor.id})` : ``}.`);
    }
  }


};

