module.exports = {


  friendlyName: 'commands.staff',


  description: 'Discord Staff command to create a private text channel between staff and member(s).',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
  },


  fn: async function (inputs) {
    // Check restrictions
    if (await sails.helpers.moderation.checkRestriction(inputs.message.member.moderation, 'cannotUseStaffCommand')) {
      return inputs.message.send(`:x: You are not allowed to use the staff command. Please contact staff in a DM if you have a legitimate inquiry.`);
    }

    var isStaff = await sails.helpers.permissions.checkRole(inputs.message.member, 'staffRole');

    // Count open channels if not staff and error if they already have 3 channels open
    if (!isStaff) {
      var channels = guild.channels.cache.filter((channel) => channel.type === 'text' && channel.guild.settings.incidentsCategory && channel.parent && channel.parent.id === channel.guild.settings.incidentsCategory && channel.name.startsWith('inquiry-') && channel.topic.includes(` ${inputs.member.user.id} `));
      if (channels.length > 2) {
        return inputs.message.send(`:x: To prevent channel flooding, members are not allowed to have more than 3 open inquiry channels.`);
      }
    }

    // Create the channel
    var channel = await sails.helpers.incidents.createChannel('inquiry', inputs.message.guild, [ inputs.message.member ]);

    // Create the intro message
    if (isStaff) {
      channel.send(`<@${inputs.message.member}>, to add members you would like to speak to, use the command !grant member.`);
    } else {
      channel.send(`:eye_in_speech_bubble: **Staff, <@${inputs.member.id}> would like to speak with you**.
      
<@${inputs.member.id}>, please send your inquiry here. If you are reporting members for rule violations, explain the violation and upload evidence, such as screenshots and recordings. You can also use the command !report member to bot-report them; if multiple people use this command, they will be muted until staff can investigate. Abuse of the report command can result in discipline.`);
    }
  }


};

