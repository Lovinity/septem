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
    var channel = await sails.helpers.resolvers.username(inputs.message, inputs.stuff);
    return channel.name;
  }


};

