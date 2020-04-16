module.exports = {


  friendlyName: 'xp.change',


  description: 'Change the XP, credits, and activityScore of a Discord member (positive = add, negative = remove).',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'The Discord member to change XP.'
    },
    amount: {
      type: 'number',
      required: true,
      description: "Amount to adjust XP and credits... positive = add, negative = remove."
    }
  },


  fn: async function (inputs) {
    Caches.get('members').set([ inputs.member.id, inputs.member.guild.id ], () => {
      return { XP: inputs.member.settings.XP + inputs.amount, credits: inputs.member.settings.XP + inputs.amount, activityScore: inputs.member.settings.activityScore + inputs.amount };
    })

    await sails.helpers.xp.checkRoles(inputs.member);
  }


};

