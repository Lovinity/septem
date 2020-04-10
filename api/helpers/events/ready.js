module.exports = {


  friendlyName: 'DiscordClient Ready',


  description: 'Discord "ready" event.',


  inputs: {

  },


  fn: async function (inputs) {
    sails.log.debug('Discord is ready!');
  }


};

