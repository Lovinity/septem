module.exports = {


  friendlyName: 'events.inputs.messageDelete',


  description: 'Discord inputs.message delete handler',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message deleted"
    }
  },


  fn: async function (inputs) {
    // If the inputs.message is a partial, we can't do anything.
    if (inputs.message.partial) {
      const owner = DiscordClient.application.owner;
      if (owner) {
        owner.send(`:question: Partial message ${inputs.message.id} was deleted.`);
      }
      return;
    }

    // Skip the bot
    if (inputs.message.author.id === DiscordClient.user.id)
      return;

    // Find out who deleted the inputs.message
    const fetchedLogs = await inputs.message.guild.fetchAuditLogs({
      limit: 1,
      type: 'MESSAGE_DELETE',
    });
    var auditLog = fetchedLogs.entries.first();
    if (!auditLog || auditLog.target.id !== inputs.message.author.id)
      auditLog = undefined;

    // Remove XP/credits
    await sails.helpers.xp.removeMessage(inputs.message);

    // Remove all rep earned from reactions, if any.
    await sails.helpers.reputation.removeAll(inputs.message);

    // Remove all starboard
    await sails.helpers.starboard.remove(inputs.message);

    // Create an embed for the event log channel
    var display = new Discord.MessageEmbed()
      .setTitle(`Deleted Message`)
      .setDescription(`${inputs.message.cleanContent}`)
      .setAuthor(inputs.message.author.tag, inputs.message.author.displayAvatarURL())
      .setFooter(`Message created **${inputs.message.createdAt}** in channel **${inputs.message.channel.name}**`);

    // Write attachment URLs
    inputs.message.attachments.array().map((attachment) => {
      display.addField(`Contained Attachment`, JSON.stringify(attachment));
    });
    // Write embeds as JSON
    inputs.message.embeds.map((embed) => {
      display.addField(`Contained Embed`, JSON.stringify(embed));
    });

    await sails.helpers.guild.send('eventLogChannel', inputs.message.guild, `:wastebasket: Message ${inputs.message.id} was deleted${auditLog ? ` by ${auditLog.executor.tag} (${auditLog.executor.id})` : ``}.`, { embed: display })
  }


};

