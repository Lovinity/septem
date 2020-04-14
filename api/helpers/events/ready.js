module.exports = {


  friendlyName: 'sails.helpers.events.ready',


  description: 'DiscordClient ready event.',


  inputs: {
  },


  fn: async function (inputs) {
    sails.log.debug(`Discord is ready!`);


    // Send a message to the owner in DM
    if (sails.config.custom.discord.clientOwner) {
      var owner = DiscordClient.users.resolve(sails.config.custom.discord.clientOwner);
      if (owner) {
        owner.send(`:arrows_counterclockwise: The bot has been rebooted.`);
      }
    }

    // Iterate through guild operations on bot startup
    DiscordClient.guilds.each(async (guild) => {

      // Kick self if the guild is black listed
      if (!guild.available)
        return;
      if (sails.config.custom.discord.guildBlacklist.includes(guild.id)) {
        guild.leave();
        sails.log.warn(`Blacklisted guild detected: ${guild.name} [${guild.id}]. Bot left.`);
        return;
      }

      // Cache the last (default #) messages in all channels
      guild.channels.each((channel) => {
        if (channel.type === 'text')
          channel.messages.fetch();
      });

      // Cycle through all the members without the verified role and assign them the stored roles if applicable.
      const verifiedRole = guild.roles.resolve(guild.settings.verifiedRole);
      const muteRole = guild.roles.resolve(guild.settings.muteRole);
      var verified = [];

      guild.members.cache.each(async (_guildMember) => {

        (async (guildMember) => {

          // Check if the member should be muted. If so, reset all roles
          // TODO: use mute checking helper when developed
          if (muteRole && (guildMember.settings.muted || guildMember.roles.cache.has(muteRole.id))) {
            if (!guildMember.roles.cache.has(muteRole.id))
              await sails.helpers.guild.send('modLogChannel', guild, `:mute: The member <@!${guildMember.user.id}> had a mute on their account and was re-muted upon the bot restarting. Check to be sure they were not trying to mute evade.`)
            Caches.get('members').set([ guildMember.id, guild.id ], () => {
              return { muted: true };
            });
            guildMember.roles.set([ guild.settings.muteRole ], `User supposed to be muted`);
          } else {
            // Member has the verified role. Update database with the current roles set in case anything changed since bot was down.
            if (verifiedRole && guildMember.roles.cache.has(verifiedRole.id)) {
              Caches.get('members').set([ guildMember.id, guild.id ], () => {
                var roles = [];
                guildMember.roles.cache.each((role) => {
                  if (role.id !== guildMember.guild.roles.everyone.id && role.id !== guildMember.guild.settings.muteRole)
                    roles.push(role.id);
                });
                return { verified: true, roles: roles };
              });

              // Member does not have verified role but has passed the verification stage, so add all roles from the database
            } else if (guildMember.settings.verified) {
              await guildMember.roles.set(settings.roles, `Re-assigning roles`)
              if (guild.settings.raidMitigation < 2 && verifiedRole) {
                verified.push(guildMember.id);
                guildMember.roles.add(verifiedRole, `User is verified`);
              }
              await sails.helpers.xp.checkRoles(guildMember);
            }
          }
        })(_guildMember);
      });

      // Make a message welcoming the new members who have been verified.
      if (verified.length > 0) {
        await sails.helpers.guild.send('generalChannel', guild, `**Welcome to our new members** ${verified.map((gm) => gm = `<@${gm}> `)}` + "\n\n" + `Sorry about me being offline, but I am back online and verified you. Thank you for your patience, and hope you enjoy your stay! Be sure to read the info channels and the rules.`);
      }

      // Remove invites that have no inviter (raid prevention)
      guild.fetchInvites()
        .then(invites => {
          invites
            .filter(invite => typeof invite.inviter === 'undefined' || invite.inviter === null)
            .each(async (invite) => {
              invite.delete('This invite has no inviter. Maybe the inviter left the guild?');
              await sails.helpers.guild.send('generalChannel', guild, `:wastebasket: The invite ${invite.code} was deleted because an inviter did not exist. They probably left the guild.`);
            });

        });
    });
  }

};

