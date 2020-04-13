module.exports = {


  friendlyName: 'events.guildBanRemove',


  description: 'Discord guild ban remove event.',


  inputs: {
    guild: {
      type: 'ref',
      required: true,
      description: 'The guild banned from.'
    },
    user: {
      type: 'ref',
      required: true,
      description: 'The user banned.'
    }
  },


  fn: async function (inputs) {
    // Upgrade partial messages to full users
    if (inputs.user.partial) {
      await inputs.user.fetch();
    }

    // Find out who applied the ban
    const fetchedLogs = await inputs.guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_BAN_REMOVE',
    });
    var auditLog = fetchedLogs.entries.first();
    if (!auditLog || auditLog.target.id !== inputs.user.id)
      auditLog = undefined;

    // Send Log
    await sails.helpers.guild.send('modLogChannel', inputs.guild, `:no_entry: :arrows_counterclockwise: A guild ban was removed from <@${inputs.user.id}> ${auditLog ? `by ${auditLog.executor.tag} (${auditLog.executor.id})` : ''}.`)
  }


};

