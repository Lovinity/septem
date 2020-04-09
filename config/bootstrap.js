/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function() {

  // Initialize Discord
  sails.config.custom.discord.client = new Discord.Client(sails.config.custom.discord.clientOptions);
  sails.config.custom.discord.client.once('ready', () => {
    sails.log.debug('Discord Ready!');
  });
  sails.config.custom.discord.client.login(sails.config.custom.discord.token);

};
