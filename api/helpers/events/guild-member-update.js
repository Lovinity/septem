module.exports = {


  friendlyName: 'events.guildMemberUpdate',


  description: 'Discord guild member update event',


  inputs: {
    oldMember: {
      type: 'ref',
      required: true,
      description: "The stats of the guild member prior to update."
    },
    newMember: {
      type: 'ref',
      required: true,
      description: "The new state of the guild member."
    }
  },


  fn: async function (inputs) {
    // Upgrade partial new members to full members
    if (inputs.newMember.partial) {
      await inputs.newMember.fetch();
    }

    const mutedRole = inputs.newMember.guild.roles.resolve(inputs.newMember.guild.settings.muteRole);
    if (mutedRole) {
      var isMuted = (inputs.newMember.roles.cache.get(inputs.newMember.guild.settings.muteRole) ? true : false);
      var wasMuted = (inputs.oldMember.partial ? false : inputs.oldMember.roles.cache.get(inputs.oldMember.guild.settings.muteRole) ? true : false);

      // Kick the user out of voice channels if they are muted
      if (isMuted && inputs.newMember.voice.channel) {
        inputs.newMember.voice.kick(`User is muted`)
      }

      // If newly muted, or muted with more than 1 role, or not muted when they should be muted, remove all roles except muted.
      if ((!wasMuted && isMuted) || (isMuted && inputs.newMember.roles.cache.size > 2) || (!isMuted && !wasMuted && inputs.newMember.settings.muted)) {
        Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
          return { muted: true };
        });
        // Remove all roles except the muted role
        inputs.newMember.roles.set([ inputs.newMember.guild.settings.muteRole ], `User muted; remove all other roles`);

      } else if (wasMuted && !isMuted) { // User was muted and is no longer muted; re-assign roles.
        Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
          return { muted: false };
        });
        inputs.newMember.roles.set(inputs.newMember.settings.roles, `User no longer muted; apply previous roles`);

      } else if (!isMuted && !wasMuted && !inputs.oldMember.partial) { // User not, nor was, muted; update role database
        Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
          var roles = [];
          inputs.newMember.roles.cache.each((role) => {
            if (role.id !== inputs.newMember.guild.roles.everyone.id && role.id !== inputs.newMember.guild.settings.muteRole)
              roles.push(role.id);
          });
          return { roles: roles };
        });
      }
    } else if (!inputs.oldMember.partial) {
      Caches.get('members').set([ inputs.newMember.id, inputs.newMember.guild.id ], () => {
        var roles = [];
        inputs.newMember.roles.cache.each((role) => {
          if (role.id !== inputs.newMember.guild.roles.everyone.id && role.id !== inputs.newMember.guild.settings.muteRole)
            roles.push(role.id);
        });
        return { roles: roles };
      });
    }
  }


};

