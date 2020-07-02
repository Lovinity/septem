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

    Caches.get('members').set([ member.id, member.guild.id ], { XP: 500 });

    return inputs.message.send(`:white_check_mark: Test completed.`);
  }


};

