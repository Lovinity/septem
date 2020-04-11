module.exports = {


  friendlyName: 'sails.helpers.events.ready',


  description: 'DiscordClient ready event.',


  inputs: {
  },


  fn: async function (inputs) {
    sails.log.debug(`Discord is ready!`);

    // Process new guilds and roles, and add settings records if necessary
    DiscordClient.guilds.cache.each(async (guild) => {
      if (typeof ModelCache.guilds[ guild.id ] === 'undefined') {
        await sails.models.guilds.findOrCreate({ guildID: guild.id }, { guildID: guild.id });

        guild.roles.cache.each(async (role) => {
          if (typeof ModelCache.guilds[ guild.id ].roles === 'undefined' || typeof ModelCache.guilds[ guild.id ].roles[ role.id ] === 'undefined') {
            await sails.models.roles.findOrCreate({ roleID: role.id }, { roleID: role.id, guildID: role.guild.id });
          }
        })
      }
    })

    // Process new channels and add settings records if necessary
    DiscordClient.channels.cache.each(async (channel) => {
      if (typeof ModelCache.channels[ channel.id ] === 'undefined') {
        await sails.models.channels.findOrCreate({ channelID: channel.id }, { channelID: channel.id, guildID: channel.guild ? channel.guild.id : null });
      }
    })


    // Send a message to the owner in DM
    if (sails.config.custom.discord.clientOwner) {
      var owner = DiscordClient.users.resolve(sails.config.custom.discord.clientOwner);
      if (owner) {
        owner.send(`:arrows_counterclockwise: The bot has been rebooted.`);
      }
    }
  }

};

