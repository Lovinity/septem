module.exports = {


  friendlyName: 'event.inputs.guildMemberAdd',


  description: 'Discord guild member add event',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'Guild member added.'
    }
  },


  fn: async function (inputs) {
    // Upgrade partial members to full members
    if (inputs.member.partial) {
      await inputs.member.fetch();
    }

    // send a log
    await sails.helpers.guild.send('eventLogChannel', inputs.member.guild, `:tada: The member <@!${inputs.member.user.id}> just joined the guild. They created their account on ${inputs.member.user.createdAt.toUTCString()}`)

    // Reassign saved roles, if any, to the member. Also, creates a settings entry in the database for them if it doesn't exist
    const verifiedRole = inputs.member.guild.roles.resolve(inputs.member.guild.settings.verifiedRole);
    const muteRole = inputs.member.guild.roles.resolve(inputs.member.guild.settings.muteRole);

    // Check if the member should be muted. If so, reset all roles
    // TODO: Use muted helper
    if (muteRole && (inputs.member.settings.muted || inputs.member.roles.cache.has(muteRole.id))) {
      inputs.member.settings.update(`muted`, true, inputs.member.guild);
      inputs.member.roles.set([ inputs.member.guild.settings.muteRole ], `User supposed to be muted`);
      await sails.helpers.guild.send('modLogChannel', inputs.member.guild, `:mute: The member <@!${inputs.member.user.id}> had a mute on their account and was re-muted upon entering the guild. Check to be sure they were not trying to mute evade.`)
    } else {
      // Re-assign saved roles
      if (inputs.member.settings.verified && inputs.member.settings.roles.length > 0) {
        inputs.member.roles.set(inputs.member.settings.roles, `Re-assigning roles`)
          .then(async () => {
            // Verify the member if we are not in raid mitigation level 2+
            if (inputs.member.guild.settings.raidMitigation < 2 && verifiedRole) {
              inputs.member.roles.add(verifiedRole, `User is verified`);
            }

            await sails.helpers.guild.send('generalChannel', inputs.member.guild, `**Welcome back** <@${inputs.member.id}>! I see you have been here before. I remembered the roles you had and all of your profile information / rewards. Please be sure to re-read the rules and information channels as things may have changed.`)
            await sails.helpers.xp.checkRoles(inputs.member);
          })
      } else if (inputs.member.settings.verified) {
        // Verify the member if we are not in raid mitigation level 2+
        if (inputs.member.guild.settings.raidMitigation < 2 && verifiedRole) {
          await sails.helpers.guild.send('generalChannel', inputs.member.guild, `**Welcome back** <@${inputs.member.id}>! I see you have been here before. I remembered the roles you had and all of your profile information / rewards. Please be sure to re-read the rules and information channels as things may have changed.`)
          await sails.helpers.xp.checkRoles(inputs.member);
          inputs.member.roles.add(verifiedRole, `User is verified`);
        } else if (verifiedRole) {
          await sails.helpers.guild.send('unverifiedChannel', inputs.member.guild, `**Welcome** <@${inputs.member.id}>! Please stand by for a short while, hopefully less than a couple hours; you had already previously passed verification, but due to an ongoing raid, I cannot let you have full guild access until the raid ends.`)
        }
      } else if (verifiedRole) {
        await sails.helpers.guild.send('unverifiedChannel', inputs.member.guild, `**Welcome new member** <@${inputs.member.id}>! You are currently unverified and may not have access to the entire guild. Please check the information channels for instructions on how to get verified. You may talk with staff and other unverified members here in the meantime.`)
      } else {
        await sails.helpers.guild.send('generalChannel', inputs.member.guild, `**Welcome new member** <@${inputs.member.id}>! Please check out the information channels for the rules and more information about us. Enjoy your stay!`)
      }
    }

    // Re-assign permissions to incident channels
    inputs.member.guild.channels.cache
      .filter((channel) => channel.type === 'text' && channel.guild.settings.incidentsCategory && channel.parent && channel.parent.id === channel.guild.settings.incidentsCategory && channel.topic.includes(` ${inputs.member.user.id} `))
      .each((channel) => {
        channel.createOverwrite(inputs.member, {
          ADD_REACTIONS: true,
          VIEW_CHANNEL: true,
          SEND_MESSAGES: true,
          EMBED_LINKS: true,
          ATTACH_FILES: true,
          READ_MESSAGE_HISTORY: true
        }, "Active incidents channel; user re-entered the guild.");
        channel.send(`:unlock: <@${inputs.member.user.id}> had (re-)entered the guild. Channel permissions were assigned so they can see it.`);
      });

    // Add a flag log if the member's account is less than 7 days old
    if (moment().subtract(7, 'days').isBefore(moment(inputs.member.user.createdAt))) {
      await sails.helpers.guild.send('flagLogChannel', inputs.member.guild, `:clock7: Member <@${inputs.member.user.id}> (${inputs.member.user.id}) just joined the guild but their user account is less than 7 days old. Trolls often create new accounts, so keep an eye on them.`)
    }

    // Add a flag log if the member has one or more active modLogs against them.
    if (inputs.member.moderation.length > 0) {
      var logs = inputs.member.moderation.filter((log) => !log.appealed);
      if (logs.length > 0) {
        await sails.helpers.guild.send('flagLogChannel', inputs.member.guild, `:police_officer: Member <@${inputs.member.user.id}> (${inputs.member.user.id}) just re-joined the guild. Keep an eye on them because they have ${logs.length} discipline records on their account. (they have ${inputs.member.HP} HP).`)
      }
    }
  }


};

