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

    Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
      var adjustment = inputs.message.XP - inputs.message.prevXP;
      inputs.message.prevXP = inputs.message.XP;
      return { XP: inputs.message.member.settings.XP + adjustment, credits: inputs.message.member.settings.credits + adjustment, activityScore: inputs.message.member.settings.activityScore + adjustment };
    })
  }


};

