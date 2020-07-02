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

    var reactionMember = inputs.reaction.message.guild.members.resolve(inputs.user);

    // Add rep if this is a rep earning message
    if (inputs.user.id !== DiscordClient.user.id && inputs.reaction.emoji.id === inputs.reaction.message.guild.settings.repEmoji) {
      var addRep = inputs.reaction.me;

      // Make sure this user can actually give reputation
      if (reactionMember && addRep && inputs.reaction.message.author.id !== inputs.user.id) {
        if (!await sails.helpers.moderation.checkRestriction(reactionMember.moderation, 'cannotGiveReputation') && !inputs.user.bot) {
          Caches.get('members').set([ inputs.reaction.message.member.id, inputs.reaction.message.guild.id ], { reputation: inputs.reaction.message.member.settings.reputation + 1 });
        } else {
          await sails.helpers.spam.add(inputs.reaction.message.member, 25);
          var _msg = await inputs.reaction.message.send(`:lock: Sorry <@${inputs.user.id}>, but you are not allowed to give reputation to other members.`);
          setTimeout(() => {
            _msg.delete();
          }, 10000);
          inputs.reaction.users.remove(inputs.user);
        }
      } else {
        inputs.reaction.users.remove(inputs.user);
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

      await sails.helpers.starboard.recheck(inputs.reaction.message);
    }
  }


};

