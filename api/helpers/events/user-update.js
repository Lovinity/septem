module.exports = {


  friendlyName: 'events.userUpdate',


  description: 'Discord user update event',


  inputs: {
    oldUser: {
      type: 'ref',
      required: true,
      description: "The old version of the user"
    },
    newUser: {
      type: 'ref',
      required: true,
      description: "The updated version of the user"
    }
  },


  fn: async function (inputs) {
    if (inputs.newUser.partial) {
      await inputs.newUser.fetch();
    }

    // Add event logs to guilds if things changed
    this.client.guilds.cache
      .filter((guild) => guild.members.resolve(inputs.newUser.id))
      .each(async (guild) => {
        // Add an event log if the user's tag changed
        if (!inputs.oldUser.partial && inputs.oldUser.tag !== inputs.newUser.tag) {
          await sails.helpers.guild.send('eventLogChannel', guild, `:star_struck: Member <@${inputs.newUser.id}> (${inputs.newUser.id}) changed their username from ${inputs.oldUser.tag} to ${inputs.newUser.tag}.`);
        }

        // Add an event log if the user's avatar changed
        if (!inputs.oldUser.partial && inputs.oldUser.avatar !== inputs.newUser.avatar) {
          await sails.helpers.guild.send('eventLogChannel', guild, `:face_with_monocle: Member <@${inputs.newUser.id}> (${inputs.newUser.id}) changed their avatar.` + "\n" + `Old: ${inputs.oldUser.displayAvatarURL()}` + "\n" + `New: ${inputs.newUser.displayAvatarURL()}`);
        }
      })
  }


};

