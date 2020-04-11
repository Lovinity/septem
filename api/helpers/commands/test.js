module.exports = {


  friendlyName: 'commands.test',


  description: 'Discord test command.',


  inputs: {
    stuff: {
      type: 'string',
      required: true
    },
  },


  fn: async function (inputs) {
    var channel = await sails.helpers.resolvers.channel(inputs.stuff);
    return channel.name;
  }


};

