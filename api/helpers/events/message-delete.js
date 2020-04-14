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
        owner.send(`:question: Partial inputs.message ${inputs.message.id} was deleted.`);
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
    if (typeof inputs.message.member !== 'undefined' && inputs.message.member !== null) {
      var xp = inputs.message.XP;
      Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
        return { XP: inputs.message.member.settings.XP - xp, credits: inputs.message.member.settings.credits - xp, activityScore: inputs.message.member.settings.activityScore - xp };
      })
    }

    // Remove all good rep earned from reactions, if any.
    if (!inputs.message.author.bot) {
      var removeRep = false;
      inputs.message.reactions.cache
        .each((_reaction) => {
          if (_reaction.me && _reaction.emoji.id === _reaction.inputs.message.guild.settings.repEmoji)
            removeRep = true;
        });

      if (removeRep) {
        inputs.message.reactions.cache
          .filter((reaction) => reaction.emoji.id === reaction.inputs.message.guild.settings.repEmoji && reaction.inputs.message.author.id !== inputs.message.author.id)
          .each(async (reaction) => {
            reaction.users.cache.each(async (reactionUser) => {
              if (!reactionUser.bot && !await sails.helpers.moderation.checkRestriction(reactionUser.guildModeration(inputs.message.guild.id), 'cannotGiveReputation'))
                Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
                  return { reputation: inputs.message.member.settings.reputation - 1 };
                })
            });
          });
      }
    }

    // Remove all starboard
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

    var display = new Discord.MessageEmbed()
      .setTitle(`Deleted Message`)
      .setDescription(`${inputs.message.cleanContent}`)
      .setAuthor(inputs.message.author.tag, inputs.message.author.displayAvatarURL())
      .setFooter(`inputs.message created **${inputs.message.createdAt}** in channel **${inputs.message.channel.name}**`);

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

