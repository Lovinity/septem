module.exports = {


  friendlyName: 'xp.removeMessage',


  description: 'Remove XP and credits from a message.',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message to remove XP/credits from"
    }
  },


  fn: async function (inputs) {
    if (!inputs.message.member)
      return;

    var xp = inputs.message.XP;
    Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
      return { XP: inputs.message.member.settings.XP - xp, credits: inputs.message.member.settings.credits - xp, activityScore: inputs.message.member.settings.activityScore - xp };
    })

    await sails.helpers.xp.checkRoles(inputs.message.member);
  }


};

