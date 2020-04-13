module.exports = {


  friendlyName: 'commands.test',


  description: 'Discord test command.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
    stuff: {
      type: 'string',
      required: true
    },
  },


  fn: async function (inputs) {
    let member = await sails.helpers.resolvers.member(inputs.message, inputs.stuff);

    Caches.get('members').set([ member.id, member.guild.id ], () => {
      return { XP: 500 }
    })
  }


};

