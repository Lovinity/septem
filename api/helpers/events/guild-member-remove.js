module.exports = {


  friendlyName: 'events.inputs.memberRemove',


  description: 'Discord guild member remove event',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: "The member that left the guild"
    }
  },


  fn: async function (inputs) {
    // Can't do anything if the guild member is a partial
    if (inputs.member.partial) {
      const owner = DiscordClient.application.owner;
      if (owner) {
        owner.send(`:question: Partial guild member ${inputs.member.id} left.`);
      }
      return;
    }

    // Find out who kicked the member if they were kicked
    const fetchedLogs = await inputs.member.guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_KICK',
    });
    var auditLog = fetchedLogs.entries.first();
    if (!auditLog || auditLog.target.id !== inputs.member.id)
      auditLog = undefined;

    // send a log to the channel
    await sails.helpers.guild.send('eventLogChannel', inputs.member.guild, `:wave: The member <@${inputs.member.user.id}> (${inputs.member.user.id}) just left the guild on ${moment().format('LLLL')} guild time.`)

    // If mewmber was kicked, log it in mod log channel
    if (auditLog)
      await sails.helpers.guild.send('modLogChannel', inputs.member.guild, `:athletic_shoe: The member <@${inputs.member.user.id}> was kicked from the guild by ${auditLog.executor.tag} (${auditLog.executor.id}).`)

    // Finalize any bans if the member has them
    await sails.helpers.member.applyBans(inputs.member);

    // Remove any invites created by the member; this helps prevent raids (user enters guild, creates invite, leaves, stages raid with the invite)
    inputs.member.guild.fetchInvites()
      .then(invites => {
        invites
          .filter(invite => typeof invite.inviter === 'undefined' || invite.inviter === null || invite.inviter.id === inputs.member.id)
          .each(async (invite) => {
            await sails.helpers.guild.send('eventLogChannel', inputs.member.guild, `:wastebasket: The invite ${invite.code} was deleted because an inviter did not exist. They probably left the guild.`)
          });

      });

    // Remove any of the member's purchased advertisements
    inputs.member.guild.ads
      .filter((ad) => ad.userID === inputs.member.id)
      .map((ad) => Caches.get('ads').delete(ad.id));

    // Delete any open support channels created by the member immediately
    inputs.member.guild.channels.cache
      .filter((channel) => channel.type === 'text' && inputs.member.guild.settings.incidentsCategory && channel.parentID === inputs.member.guild.settings.incidentsCategory && channel.name.startsWith('support-') && channel.topic.includes(` ${inputs.member.id} `))
      .map((channel) => channel.delete(`Member left the guild`))

    // Post in other incidents channels
    inputs.member.guild.channels.cache
      .filter((channel) => channel.type === 'text' && inputs.member.guild.settings.incidentsCategory && channel.parentID === inputs.member.guild.settings.incidentsCategory && channel.topic.includes(` ${inputs.member.id} `))
      .map((channel) => channel.send(`:wave: Member <@${inputs.member.id}> left the guild.`))

    // Post in general if the member left within 1 hour of joining
    if (moment().subtract(1, 'hours').isBefore(moment(inputs.member.joinedAt))) {
      await sails.helpers.guild.send('generalChannel', inputs.member.guild, `:frowning: O-oh, <@${inputs.member.user.id}> did not want to stay after all.`)
    }
  }


};

