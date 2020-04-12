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
    var member = await sails.helpers.resolvers.member(inputs.message, inputs.stuff);
    console.dir(member.settings);
    return member.user.tag;
  }


};

