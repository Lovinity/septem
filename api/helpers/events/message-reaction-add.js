module.exports = {


  friendlyName: 'events.messageReactionAdd',


  description: 'Discord message reaction add event',


  inputs: {
    reaction: {
      type: 'ref',
      required: true,
      description: "The reaction object"
    },
    user: {
      type: 'ref',
      required: true,
      description: "The user who added the reaction"
    }
  },


  fn: async function (inputs) {

    // Fetch partials
    if (inputs.reaction.partial) await inputs.reaction.partial.fetch();
    if (inputs.reaction.message.partial) await inputs.reaction.message.fetch();
    if (inputs.user.partial) await inputs.user.fetch();

    // Ignore non-guild reactions
    if (!inputs.reaction.message.member)
      return null;

    var reactionMember = inputs.reaction.message.guild.members.resolve(user);

    // Add rep if this is a rep earning message
    if (inputs.user.id !== DiscordClient.user.id && inputs.reaction.emoji.id === inputs.reaction.message.guild.settings.repEmoji) {
      var addRep = inputs.reaction.me;

      // Make sure this user can actually give reputation
      if (reactionMember && addRep && inputs.reaction.message.author.id !== inputs.user.id) {
        if (!await sails.helpers.moderation.checkRestriction(reactionMember.moderation, 'cannotGiveReputation') && !inputs.user.bot) {
          Caches.get('members').set([ inputs.reaction.message.member.id, inputs.reaction.message.guild.id ], () => {
            return { reputation: inputs.reaction.message.member.settings.reputation + 1 };
          })
        } else {
          await sails.helpers.spam.add(inputs.reaction.message.member, 25);
          var _msg = await inputs.reaction.message.send(`:lock: Sorry <@${inputs.user.id}>, but you are not allowed to give reputation to other members.`);
          setTimeout(() => {
            _msg.delete();
          }, 10000);
          inputs.reaction.users.remove(user);
        }
      } else {
        inputs.reaction.users.remove(user);
        if (inputs.reaction.message.author.id === inputs.user.id) {
          var _msg = await inputs.reaction.message.send(`:lock: Sorry <@${inputs.user.id}>, but you can't give reputation to yourself.`);
          setTimeout(() => {
            _msg.delete();
          }, 10000);
          await sails.helpers.spam.add(inputs.reaction.message.member, 10);
        } else if (!addRep) {
          var _msg = await inputs.reaction.message.send(`:lock: Sorry <@${inputs.user.id}>, but that message does not qualify for reputation.`);
          setTimeout(() => {
            _msg.delete();
          }, 10000);
          await sails.helpers.spam.add(inputs.reaction.message.member, 10);
        }
      }

      // Starboard (via rep emoji)
      const msg = inputs.reaction.message;
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
  }


};

