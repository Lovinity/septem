module.exports = {


  friendlyName: 'xp.applyMessage',


  description: 'Adjust the XP and credits of a Discord member based on the provided message',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
  },


  fn: async function (inputs) {
    if (!inputs.message.member)
      return;

    var adjustment = inputs.message.XP;
    Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
      return { XP: inputs.message.member.settings.XP + adjustment, credits: inputs.message.member.settings.credits + adjustment, activityScore: inputs.message.member.settings.activityScore + adjustment };
    })

    await sails.helpers.xp.checkRoles(inputs.message.member);
  }


};

