module.exports = {


  friendlyName: 'reputation.removeAll',


  description: 'Remove all reputation earned from a message',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message to remove reputation from."
    }
  },


  fn: async function (inputs) {
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
                Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], { reputation: inputs.message.member.settings.reputation - 1 });
            });
          });
      }
    }
  }


};

