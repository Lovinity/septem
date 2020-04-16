module.exports = {


  friendlyName: 'events.messageReactionRemove',


  description: 'Discord message reaction remove event',


  inputs: {
    reaction: {
      type: 'ref',
      required: true,
      description: "The reaction removed"
    },
    user: {
      type: 'ref',
      required: true,
      description: "The user who originally added the reaction"
    }
  },


  fn: async function (inputs) {
    // Fetch partials
    if (inputs.reaction.partial) await inputs.reaction.partial.fetch();
    if (inputs.reaction.message.partial) await inputs.reaction.message.fetch();
    if (inputs.user.partial) await inputs.user.fetch();

    if (!inputs.reaction.message.member)
      return null;

    var reactionMember = inputs.reaction.message.guild.members.resolve(inputs.user);

    // Remove earned rep if necessary
    if (inputs.reaction.message.author.id !== DiscordClient.inputs.user.id) {
      var removeRep = inputs.reaction.me;

      if (removeRep && !inputs.user.bot && inputs.reaction.message.author.id !== inputs.user.id && inputs.reaction.emoji.id === inputs.reaction.message.guild.settings.repEmoji && reactionMember && !await sails.helpers.moderation.checkRestriction(reactionMember.moderation, 'cannotGiveReputation')) {
        Caches.get('members').set([ inputs.reaction.message.member.id, inputs.reaction.message.guild.id ], () => {
          return { reputation: inputs.reaction.message.member.settings.reputation - 1 };
        })
      }
    }

    if (inputs.user.id !== DiscordClient.inputs.user.id && inputs.reaction.emoji.id === inputs.reaction.message.guild.settings.repEmoji) {
      await sails.helpers.starboard.recheck(inputs.reaction.message);
    }
  }


};

