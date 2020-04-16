module.exports = {


  friendlyName: 'starboard.recheck',


  description: 'Recheck a message for its qualification on the starboard channel and how many rep it has.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message to check starboard qualification on."
    }
  },


  fn: async function (inputs) {
    // Starboard (via rep emoji)
    const msg = inputs.message;
    const { guild } = msg;
    const starChannel = guild.channels.resolve(guild.settings.starboardChannel);
    var reactionCount = 0;
    if (guild && guild.settings.repEmoji && starChannel) {
      var msgReactions = msg.reactions.resolve(guild.settings.repEmoji);
      if (msgReactions) {
        var reactionUsers = await msgReactions.users.fetch();
        if (reactionUsers) {
          var maps = reactionUsers.cache.map(async (reactionUser) => {
            if (reaction.user.id !== DiscordClient.user.id && !reaction.user.bot && msg.author.id !== reaction.user.id) {
              var reactionMember = guild.members.resolve(reactionUser);
              if (reactionMember) {
                if (!await sails.helpers.moderation.checkRestriction(reactionMember.moderation, 'cannotGiveReputation')) {
                  reactionCount++;
                }
              }
            }
          });
          await Promise.all(maps);
        }
      }
    }

    if (guild && starChannel && reactionCount >= guild.settings.starboardRequired) {
      if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {
        const fetch = await starChannel.messages.fetch({ limit: 100 });
        const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));

        const jumpString = `[View The Original Message](https://discordapp.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})\n`;

        if (starMsg) {
          const starEmbed = starMsg.embeds[ 0 ];
          const image = msg.attachments.size > 0 ? await sails.helpers.attachments.checkImage(msg.attachments.array()[ 0 ].url) : null;

          const embed = new Discord.MessageEmbed()
            .setColor(starEmbed.color)
            .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
            .setTimestamp(new Date(msg.createdTimestamp))
            .setFooter(`REP: +${reactionCount} | ${msg.id}`);
          if (image) embed.setImage(image);
          if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
          else embed.setDescription(jumpString);

          const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);

          if (oldMsg && oldMsg.author.id === DiscordClient.user.id)
            await oldMsg.edit({ embed });
        } else {
          const image = msg.attachments.size > 0 ? await sails.helpers.attachments.checkImage(msg.attachments.array()[ 0 ].url) : null;
          if (image || msg.content) {
            const embed = new Discord.MessageEmbed()
              .setColor(15844367)
              .setAuthor(`${msg.author.tag} in #${msg.channel.name}`, msg.author.displayAvatarURL())
              .setTimestamp(new Date(msg.createdTimestamp))
              .setFooter(`REP: +${reactionCount} | ${msg.id}`);
            if (image) embed.setImage(image);
            if (msg.content) embed.setDescription(`${jumpString}${msg.content}`);
            else embed.setDescription(jumpString);

            await starChannel.send({ embed });
          }
        }
      }
    } else if (guild && starChannel) {
      const fetch = await starChannel.messages.fetch({ limit: 100 });
      const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("REP:") && m.embeds[ 0 ].footer.text.endsWith(msg.id));
      if (starMsg) {
        const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);

        if (oldMsg && oldMsg.author.id !== DiscordClient.user.id)
          await oldMsg.delete(`Starboard message no longer qualifies to be on the starboard.`);
      }
    }
  }


};

