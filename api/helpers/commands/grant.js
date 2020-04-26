module.exports = {


  friendlyName: 'commands.grant',


  description: 'Grant access to an incidents channel for the specified member.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
    member: {
      type: 'string',
      required: true,
      description: 'A username, mention, or snowflake of the person to grant to the channel.'
    }
  },


  fn: async function (inputs) {
    // Reject if command not used in an incidents channel
    if (inputs.message.channel.type !== 'text' || !inputs.message.guild.settings.incidentsCategory || !inputs.message.channel.parent || inputs.message.channel.parent.id !== inputs.message.guild.settings.incidentsCategory) {
      await sails.helpers.spam.add(inputs.message.member, 20, inputs.message);
      return inputs.message.send(':x: This command may only be used in an incidents channel.');
    }

    // Reject if: not a support channel and not staff, or support channel and not author. 
    if (inputs.message.channel.name.startsWith("support-")) {
      if (!inputs.message.channel.topic.includes(` ${inputs.message.member.id} `)) {
        await sails.helpers.spam.add(inputs.message.member, 20, inputs.message);
        return inputs.message.send(':x: Only the person who created the support channel may use the grant command.');
      }
    } else {
      if (!await sails.helpers.permissions.checkRole(inputs.message.member, 'staffRole')) {
        await sails.helpers.spam.add(inputs.message.member, 20, inputs.message);
        return inputs.message.send(':x: Only staff may use the grant command in this channel.');
      }
    }

    var member = await sails.helpers.resolvers.username(inputs.member);

    // Grant permissions
    inputs.message.channel.createOverwrite(member, {
      ADD_REACTIONS: true,
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
      EMBED_LINKS: true,
      ATTACH_FILES: true,
      READ_MESSAGE_HISTORY: true
    }, "Use of the !grant command");

    // Add them to topic if not already added
    if (!inputs.message.channel.topic.includes(` ${member.id} `) && !inputs.message.channel.name.startsWith("support-")) {
      inputs.message.channel.setTopic(`${inputs.message.channel.topic} ${member.id} `, "Use of the !grant command");
    }

    // Add message
    if (inputs.message.channel.name.startsWith("support-")) {
      inputs.message.send(`:white_check_mark: Member has been granted access to this channel.`);
    } else if (inputs.message.channel.name.startsWith("inquiry-")) {
      inputs.message.send(`<@${member.id}>, **staff would like to speak with you** in this private text channel. Usually, inquiry channels do not mean you are in trouble. Please wait until a staff member addresses you.`);
    } else if (inputs.message.channel.name.startsWith("interrogation-")) {
      await sails.helpers.permissions.addRole(member, 'muteRole', `!grant command on ${inputs.message.channel.name}`);
      inputs.message.send(`<@${member.id}>, **staff would like to ask you some questions about something recent you did**. You are muted in the guild during this interrogation for the safety of others. You are expected to be respectful of staff and answer their questions with honesty. You may request at any time for the interrogation to end; staff will use what they have at that point to decide on disciplinary action, if necessary, but you forego the opportunity to defend yourself.`);
    }
  }


};

