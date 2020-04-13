module.exports = {


  friendlyName: 'spam.applyMessage',


  description: 'Apply spam score for the provided message.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
  },


  fn: async function (inputs) {
    try {
      if (!inputs.message.member)
        return;

      Caches.get('members').set([ inputs.message.member.id, inputs.message.guild.id ], () => {
        var adjustment = inputs.message.spamScore - inputs.message.prevSpamScore;
        return { spamScore: inputs.message.member.settings.spamScore + adjustment }
      })

    } catch (e) {
      sails.log.error(e);
    }
  }


};

