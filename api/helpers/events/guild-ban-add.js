module.exports = {


  friendlyName: 'events.guildBanAdd',


  description: 'Discord guild ban add event.',


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
      type: 'MEMBER_BAN_ADD',
    });
    var auditLog = fetchedLogs.entries.first();
    if (!auditLog || auditLog.target.id !== inputs.user.id)
      auditLog = undefined;

    // Send Log
    await sails.helpers.guild.send('modLogChannel', inputs.guild, `:no_entry: A guild ban was added on <@${inputs.user.id}> ${auditLog ? `by ${auditLog.executor.tag} (${auditLog.executor.id})` : ''}.`)
  }


};

