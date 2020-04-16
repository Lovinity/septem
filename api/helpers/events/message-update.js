module.exports = {


  friendlyName: 'events.messageUpdate',


  description: 'Discord message update event',


  inputs: {
    old: {
      type: 'ref',
      required: true,
      description: "Old message"
    },
    message: {
      type: 'ref',
      required: true,
      description: "New message"
    }
  },


  fn: async function (inputs) {
    var jsdiff = require('diff');
    // Upgrade partial messages to full messages
    if (inputs.message.partial) {
      await inputs.message.fetch();
    }

    // First, update spam score if new score is bigger than old score. Do NOT update if new score is less than old score; we don't want to lower it.
    try {
      if (inputs.message.type === 'DEFAULT' && typeof inputs.message.member !== 'undefined' && inputs.message.member !== null) {
        var oldscore = inputs.old.partial ? 1000000 : inputs.old.spamScore;
        var newscore = inputs.message.spamScore;
        if (newscore > oldscore) {
          var diff = newscore - oldscore;
          await sails.helpers.spam.add(inputs.message.member, diff, inputs.message);
        }
      }

      if (typeof inputs.message.member !== 'undefined' && inputs.message.member !== null && inputs.message.author.id !== DiscordClient.user.id) {
        // Remove all reactions to reset reputation
        inputs.message.reactions.removeAll();

        var xp1 = inputs.old.partial ? inputs.message.XP : inputs.old.XP;
        var xp2 = inputs.message.XP;
        if (newscore > inputs.message.guild.settings.antispamCooldown) {
          xp2 = 0;
          // Add rep emoji if 15 or more XP was assigned
        } else if (inputs.message.member && !inputs.message.author.bot && xp2 >= 15) {
          inputs.message.react(inputs.message.guild.settings.repEmoji);
        }
        // Change XP and credits
        if (xp2 - xp1 !== 0) {
          await sails.helpers.xp.change(inputs.message.member, xp2 - xp1);
        }
      }
    } catch (e) {
      await sails.helpers.events.error(e);
    }

    // Skip the bot
    if (inputs.message.author.id === DiscordClient.user.id)
      return;

    var display = new Discord.MessageEmbed()
      .setTitle(`Old Message`)
      .setDescription(`${inputs.old.partial ? `Unknown Messahe` : inputs.old.cleanContent}`)
      .setAuthor(inputs.message.author.tag, inputs.message.author.displayAvatarURL())
      .setFooter(`Message created **${inputs.message.createdAt}** in channel **${inputs.message.channel.name}**`);

    // First, determine any attachment changes
    var oldAttachments = [];
    var newAttachments = [];

    if (!inputs.old.partial) {
      inputs.old.attachments.array().map((attachment) => {
        oldAttachments.push(attachment.url);
      });
    }

    inputs.message.attachments.array().map((attachment) => {
      newAttachments.push(attachment.url);
    });

    oldAttachments.map((attachment) => {
      if (newAttachments.indexOf(attachment.url) === -1)
        display.addField(`Attachment removed`, JSON.stringify(attachment));
    });

    newAttachments.map((attachment) => {
      if (oldAttachments.indexOf(attachment.url) === -1)
        display.addField(`Attachment added`, JSON.stringify(attachment));
    });

    // Next, determine embed changes

    var oldEmbeds = [];
    var newEmbeds = [];

    if (!inputs.old.partial) {
      inputs.old.embeds.map((embed) => {
        oldEmbeds.push(JSON.stringify(embed));
      });
    }

    inputs.message.embeds.map((embed) => {
      newEmbeds.push(JSON.stringify(embed));
    });

    oldEmbeds.map((embed) => {
      if (newEmbeds.indexOf(embed) === -1)
        display.addField(`Embed removed`, embed);
    });

    newEmbeds.map((embed) => {
      if (oldEmbeds.indexOf(embed) === -1)
        display.addField(`Embed added`, embed);
    });

    // Get the differences between old and new content
    var diff = jsdiff.diffSentences(inputs.old.partial ? `` : inputs.old.cleanContent, inputs.message.cleanContent);
    diff.map(function (part) {
      if (part.added) {
        display.addField(`Part added`, part.value);
      } else if (part.removed) {
        display.addField(`Part removed`, part.value);
      }
    });

    // send a log to the channel
    await sails.helpers.guild.send('eventLogChannel', inputs.message.guild, `:pencil: Message ${inputs.message.id} was edited.`, { embed: display });
  }


};

