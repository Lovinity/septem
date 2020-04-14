module.exports = {


  friendlyName: 'member.applyBans',


  description: 'Bans are not immediately applied when issued. This helper applies them when the member leaves or is not present.',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: "The member that left the guild"
    }
  },


  fn: async function (inputs) {
    var pendBans = inputs.member.moderation.filter((log) => !log.appealed && log.banDuration !== null);
    if (pendBans && pendBans.length > 0) {
      pendBans.map(async (ban) => {
        if (!await inputs.member.guild.fetchBan(inputs.member)) {
          inputs.member.ban({ days: 7, reason: ban.reason });
          await sails.helpers.guild.send('modLogChannel', inputs.member.guild, `:wave: A pending ban / tempban existed on <@!${inputs.member.user.id}> (${inputs.member.user.id}). It was applied.`);
          if (ban.banDuration > 0 && !ban.schedule) {
            var uid = await sails.helpers.uid();
            await sails.helpers.schedules.create({
              uid: uid,
              task: 'removeBan',
              data: {
                user: inputs.member.user.id,
                guild: inputs.member.guild.id,
                case: ban.case
              },
              nextRun: moment().add(ban.duration, 'days').toDate()
            });
            Caches.get('moderation').set([ ban.case ], () => {
              return { schedule: uid }
            })
          }
        }
      });
    }
  }


};

