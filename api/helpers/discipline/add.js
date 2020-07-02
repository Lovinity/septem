module.exports = {


  friendlyName: 'discipline.add',


  description: 'Take a disciplinary action against a member. You should create an incidents channel first.',


  inputs: {
    channel: {
      type: 'ref',
      required: true,
      description: "The incidents channel for this discipline. The uid will be derived from its name."
    },
    user: {
      type: 'ref',
      required: true,
      description: "The user being disciplined (not guild member; that way, we can discipline members not in the guild)."
    },
    guild: {
      type: 'ref',
      required: true,
      description: "The guild to discipline the user in."
    },
    issuer: {
      type: 'ref',
      required: true,
      description: "The user issuing the action."
    },

    // Discipline-specific inputs
    type: {
      type: 'string',
      isIn: [ 'Warning', 'Basic Discipline', 'Antispam Discipline', 'Reflection / Research', 'Access Restrictions', 'Ban', 'Investigation' ],
      required: true,
      description: 'The type of discipline this is'
    },
    rules: {
      type: 'json',
      required: true,
      description: "Array of rule numbers violated."
    },
    reason: {
      type: 'string',
      defaultsTo: 'No reason specified; please contact the staff.',
      maxLength: 1024,
      description: "Concise description of what the user did to warrant this action. Also include links to immediate evidence."
    },
    additionalInformation: {
      type: 'string',
      maxLength: 1024,
      allowNull: true,
      description: "Any additional information or discipline issued."
    },

    // Basic discipline
    XP: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Amount of XP to take away'
    },
    credits: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Number of credits to fine from the member.'
    },
    damage: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Amount of HP damage to apply to the member for this discipline.'
    },

    // Reflection / Research
    apologies: {
      type: 'json',
      description: 'Array of string descriptors (such as usernames) of the people this member is required to write an apology to.'
    },
    research: {
      type: 'json',
      description: 'Array of research paper topics this member must write about.'
    },
    retractions: {
      type: 'json',
      description: 'Array of retraction statements this member must write.'
    },
    quizzes: {
      type: 'json',
      description: 'Array of quizzes this member must take.'
    },

    // Access restrictions
    muteDuration: {
      type: 'number',
      allowNull: true,
      description: 'If this member is to be muted, the duration of the mute in minutes. Use 0 for indefinite.'
    },
    channelRestrictions: {
      type: 'json',
      description: 'Array of channel IDs the member to lose privileges to use.'
    },
    rolesAdded: {
      type: 'json',
      description: 'Array of role IDs to add to this member.'
    },
    rolesRemoved: {
      type: 'json',
      description: 'Array of role IDs to remove from this member.'
    },
    cannotUseVoiceChannels: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from using any voice channels.'
    },
    cannotGiveReputation: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from giving any reputation to other members.'
    },
    cannotUseStaffCommand: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from using the staff command.'
    },
    cannotUseReportCommand: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from using the report command.'
    },
    cannotUseSupportCommand: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from using the support command.'
    },
    cannotUseConflictCommand: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from using the conflict command.'
    },
    cannotPurchaseAds: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from purchasing ads.'
    },
    cannotEditProfile: {
      type: 'boolean',
      defaultsTo: false,
      description: 'True if this discipline should prohibit the member from editing their profile.'
    },

    // Bans
    banDuration: {
      type: 'number',
      allowNull: true,
      description: 'If this member is to be banned, the amount of time the ban should last, in days. Use 0 for permanent.'
    },
  },


  fn: async function (inputs) {
    var uid = inputs.channel.name.split("-");
    if (!uid[ 1 ]) {
      uid = await sails.helpers.uid();
    } else {
      uid = uid[ 1 ];
    }

    var guildMember = await inputs.guild.members.resolve(inputs.user);

    // Init the info for the public mod channel
    var publicString = ``;

    // Init the message
    var msg = new Discord.MessageEmbed()
      .setAuthor(`Issued by: ${inputs.issuer.tag}`)
      .setColor(colour(inputs.type))
      .setURL(`${sails.config.custom.baseURL}/modlogs.html?user=${inputs.user.id}`);

    // Init the log
    Caches.get('moderation').set([ uid ], {
      userID: inputs.user.id,
      guildID: inputs.guild.id,
      type: inputs.type,
      issuer: inputs.issuer.id,
      appealed: false,
      rules: inputs.rules,
      reason: inputs.reason,
      XP: inputs.XP,
      credits: inputs.credits,
      damage: inputs.damage,
      channelRestrictions: inputs.channelRestrictions,
      rolesAdded: inputs.rolesAdded,
      rolesRemoved: inputs.rolesRemoved,
      cannotUseVoiceChannels: inputs.cannotUseVoiceChannels,
      cannotGiveReputation: inputs.cannotGiveReputation,
      cannotUseStaffCommand: inputs.cannotUseStaffCommand,
      cannotUseReportCommand: inputs.cannotUseReportCommand,
      cannotUseSupportCommand: inputs.cannotUseSupportCommand,
      cannotUseConflictCommand: inputs.cannotUseConflictCommand,
      cannotPurchaseAds: inputs.cannotPurchaseAds,
      cannotEditProfile: inputs.cannotEditProfile,
      apologies: inputs.apologies,
      research: inputs.research,
      retractions: inputs.retractions,
      quizzes: inputs.quizzes,
      muteDuration: inputs.muteDuration,
      banDuration: inputs.banDuration,
      additionalInformation: inputs.additionalInformation
    });

    // Set up a function called for class D discipline and higher
    var classD = () => {

      // Check to ensure at least one class D discipline was specified
      if (inputs.apologies || inputs.research || inputs.retraction || inputs.quizzes) {

        // Format the mute depending on whether or not a temp ban is issued
        if (inputs.banDuration === null) {
          inputs.muteDuration = 0;
          msg.addField(`:clipboard: **You are required to complete tasks**`, `This notice includes one or more required tasks for you to complete. Please note the following:` + "\n" + `---You are muted in the guild until all tasks have been completed / satisfied.` + "\n" + `---**You have 7 days to complete all tasks** unless otherwise mentioned. Otherwise, you will be kicked from the guild, but you are free to return once you completed your tasks.`);
        } else {
          msg.addField(`:clipboard: **You are required to complete tasks when you return to the guild**`, `This notice includes one or more required tasks for you to complete once you return to the guild from your temporary ban. Please note the following:` + "\n" + `---You are muted in the guild. Once you return after your temporary ban, you will remain muted until all tasks are completed / satisfied.` + "\n" + `---**You will have 7 days to complete all tasks from the time you return to the guild after your ban** unless otherwise mentioned. Otherwise, you will be kicked from the guild, but you are free to return once you completed your tasks.`);
        }
        // No class D discipline, but a mute was specified? Make a mute discipline message based on duration.
      } else if (inputs.muteDuration !== null) {
        msg.addField(`:mute: **You have been muted until ${inputs.muteDuration === 0 ? `staff unmute you` : `${moment().add(inputs.muteDuration, 'minutes').format("LLLL Z")}`}**`, `You will not have access to any of the guild channels (except this) nor members (except staff) until the mute is removed or expired.`);
      }

      // Make messages depending on class D discipline specified.
      if (inputs.apologies) {
        msg.addField(`:sweat_smile: **You must write one or more apologies**`, inputs.apologies.map((record) => `◾${record}`).join("\n"));
        msg.addField(`Apology requirements (each)`, `---No less than 250 words long.` + "\n" + `---Must acknowledge you did wrong, state what you did wrong, mention how your behavior impacted the members/community, what you learned, and what you will do to ensure this does not happen again.` + "\n" + `---May not contain excuses, justifications, nor defensive language.` + "\n" + `---Post completed apologies in this channel as an attachment or link to an online document. You will then be required with staff guidance to present your apologies directly to addressed members.`);
      }

      if (inputs.research) {
        msg.addField(`:pencil: **You must write one or more research papers**`, inputs.research.map((record) => `◾${record}`).join("\n"));
        msg.addField(`Research Paper requirements (each)`, `---No less than 500 words long.` + "\n" + `---Must contain an introduction / thesis, body (supporting details, facts, and evidence), and conclusion (what you learned and how you will apply this knowledge).` + "\n" + `---Must have at least 2 credible sources cited (ask staff for help on what is deemed "credible").` + "\n" + `---Post completed research papers in this channel as an attachment or link to an online document. You might additionally be required with staff guidance to present your research to the guild.`);
      }

      if (inputs.retraction) {
        msg.addField(`:page_facing_up: **You must write one or more retraction statements**`, inputs.retraction.map((record) => `◾${record}`).join("\n"));
        msg.addField(`Retraction Statement requirements (each)`, `---No less than 250 words long.` + "\n" + `---Must contain an introduction (what you originally said, and acknowledgment that it was wrong / inaccurate), body (the correct facts and evidence / citations to support that), and conclusion (what you learned and how you will apply this knowledge).` + "\n" + `---Must have at least 2 credible sources cited (ask staff for help on what is deemed "credible").` + "\n" + `---Post completed retraction statements in this channel as an attachment or link to an online document. You will then be required with staff guidance to present your retraction statements to the guild.`);
      }

      if (inputs.quizzes) {
        msg.addField(`:question: **You must take and pass one or more quizzes**`, inputs.quizzes.map((record) => `◾${record}`).join("\n"));
      }
    }

    // Update the incidents channel with relevant information
    switch (inputs.type) {
      case 'Warning':
        inputs.muteDuration = null;
        inputs.banDuration = null;
        msg.setTitle(`:warning: **__FORMAL WARNING__** :warning:`);
        msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/warning.png`);
        msg.setDescription(`We are concerned about your recent conduct. Please read this information carefully. Future incidents can result in discipline. You may ask staff any questions you have, or to help you develop an action plan to avoid these incidents in the future, in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
        msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this warning because you were not in the guild at the time the warning was issued.` : `🔄 You have 48 hours to appeal this warning in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
        publicString = `:warning: <@${inputs.user.id}> (${inputs.user.tag}) was warned by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        break;
      case 'Basic Discipline':
        inputs.muteDuration = null;
        inputs.banDuration = null;
        msg.setTitle(`:octagonal_sign: **__NOTICE OF DISCIPLINARY ACTION__** :octagonal_sign:`);
        msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/discipline.png`);
        msg.setDescription(`You have recently violated our rules and have been issued basic discipline. Please read the following information carefully. You may ask questions or request help to develop an action plan in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
        msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
        publicString = `:octagonal_sign: <@${inputs.user.id}> (${inputs.user.tag}) was issued discipline by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        break;
      case 'Antispam Discipline':
        if (inputs.banDuration === null && inputs.muteDuration !== null) {
          msg.setTitle(`:mute: **__NOTICE OF ANTISPAM MUTE__** :mute:`);
          msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/mute.png`);
          msg.setDescription(`You have been muted by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
          msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
          publicString = `:mute: <@${inputs.user.id}> (${inputs.user.tag}) was antispam muted by the bot.`;
        } else if (inputs.banDuration > 0) {
          msg.setTitle(`:no_entry: **__NOTICE OF ANTISPAM TEMPORARY BAN__** :no_entry:`);
          msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/tempban.png`);
          msg.setDescription(`You have been temporarily banned by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
          msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
          publicString = `:no_entry: <@${inputs.user.id}> (${inputs.user.tag}) was antispam temp-banned by the bot.`;
        } else if (inputs.banDuration === 0) {
          msg.setTitle(`:no_entry_sign: **__NOTICE OF ANTISPAM PERMANENT BAN__** :no_entry_sign:`);
          msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/ban.png`);
          msg.setDescription(`You have been permanently banned by the automatic antispam system. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
          msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if the bot did not give you a mentioned warning before antispam disciplining you (you cannot appeal for any other reason). Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
          publicString = `:no_entry_sign: <@${inputs.user.id}> (${inputs.user.tag}) was antispam perma-banned by the bot.`;
        }
        break;
      case 'Reflection / Research':
        inputs.muteDuration = 0;
        inputs.banDuration = null;
        msg.setTitle(`:notebook: **__NOTICE OF REFLECTION / RESEARCH REQUIREMENTS__** :notebook:`);
        msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/assignment.png`);
        msg.setDescription(`You have recently violated our rules. We need you to complete one or more tasks to be allowed participation again in the guild. Please read the following information carefully. You may ask questions or request help in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
        msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
        publicString = `:octagonal_sign: <@${inputs.user.id}> (${inputs.user.tag}) was issued discipline by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        break;
      case 'Access Restrictions':
        inputs.banDuration = null;
        msg.setTitle(`:closed_lock_with_key: **__NOTICE OF RESTRICTIONS__** :closed_lock_with_key:`);
        msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/restrictions.png`);
        msg.setDescription(`Due to the nature of your recent rule violations, we had to issue restrictions on you to protect the safety and integrity of the guild. Please read the following information carefully. You may ask questions or request help in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
        msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
        publicString = `:octagonal_sign: <@${inputs.user.id}> (${inputs.user.tag}) was issued discipline by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        break;
      case 'Ban':
        inputs.muteDuration = null;
        if (!inputs.banDuration) {
          msg.setTitle(`:no_entry_sign: **__NOTICE OF PERMANENT BAN__** :no_entry_sign:`);
          msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/ban.png`);
          msg.setDescription(`Your conduct has caused irreversible harm to our community. You are required to leave indefinitely for the safety and integrity of the community. Please read the following information carefully. You may ask questions in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
          msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
          publicString = `:no_entry_sign: <@${inputs.user.id}> (${inputs.user.tag}) was permanently banned by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        } else {
          msg.setTitle(`:no_entry: **__NOTICE OF TEMPORARY BAN__** :no_entry:`);
          msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/tempban.png`);
          msg.setDescription(`Your conduct has caused significant problems in the community. You are required to leave for a temporary time to reflect on, and improve, your behavior. Please read the following information carefully. You may ask questions or request help to develop an action plan in this channel.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
          msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `${!guildMember ? `🔄 You cannot appeal this discipline because you were not in the guild at the time discipline was issued.` : `🔄 You have 48 hours to appeal this discipline in this channel if it was issued unjustly. Leaving the guild, being disrespectful towards staff, or trying to discuss this matter outside of this text channel will remove your privilege to appeal.`}` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
          publicString = `:no_entry: <@${inputs.user.id}> (${inputs.user.tag}) was temporarily banned by <@${inputs.issuer.id}> for violating rule number(s) ${inputs.rules.join(", ")}.`;
        }
        break;
      case 'classG':
        inputs.muteDuration = 0;
        inputs.banDuration = null;
        msg.setTitle(`:mag: **__NOTICE OF INVESTIGATIVE MUTE__** :mag:`);
        msg.setThumbnail(`${sails.config.custom.baseURL}/assets/images/discipline/ban.png`);
        msg.setDescription(`Your recent conduct necessitates an investigation by a third party, such as Discord or law enforcement. You have been muted during the investigation. Please read the following information carefully.` + "\n\n" + `:hash: You are in violation of rule number(s) ${inputs.rules.join(", ")}` + "\n" + `${inputs.reason}`);
        msg.setFooter(`🔒 This channel is private between you and staff to discuss this matter. Please remain respectful.` + "\n" + `👮 You must comply with staff's questions and instruction, and provide only truthful information. Failure will result in a permanent ban. The only acceptable forms of civil disobedience is polite refusal to answer questions, remaining silent, or leaving the guild.` + "\n" + `😊 Thank you for your understanding and cooperation.` + "\n\n" + `#️⃣ Case ID: ${uid}`);
        publicString = `:no_entry: <@${inputs.user.id}> (${inputs.user.tag}) is being investigated by <@${inputs.issuer.id}> for possible illegal activity via violating rule number(s) ${inputs.rules.join(", ")}.`;
    }

    // Bans
    if (inputs.banDuration !== null) {
      if (inputs.banDuration === 0) {
        msg.addField(`:no_entry_sign: **You have been permanently banned**`, `You are no longer welcome here and are required to leave indefinitely. We hope you enjoyed your stay and wish you luck in your journey.` + "\n" + `Once you leave the guild, a ban will be placed on you. This ban will remain in place indefinitely or until staff manually remove it. Until you leave or staff kick you, you will remain muted.`)
      } else {
        msg.addField(`:no_entry: **You have been temporarily banned for ${inputs.banDuration} days**`, `You are required to leave the guild and reflect on, and improve, your behavior.` + "\n" + `Once you leave the guild, a ban will be placed on you, which will be removed by the bot in ${inputs.banDuration} days. Your temp-ban time will not begin until you leave the guild or get kicked; until then, you will remain muted.`);
      }
    }

    // Add a schedule if a mute is in place
    if (inputs.muteDuration !== null && inputs.muteDuration > 0 && (!inputs.banDuration || !guildMember)) {
      await sails.models.schedules.create({
        uid: uid,
        task: 'removeMute',
        data: {
          user: inputs.user.id,
          guild: inputs.guild.id
        },
        nextRun: moment().add(inputs.muteDuration, 'minutes').toISOString(true)
      });
      Caches.get('moderation').set([ uid ], { schedule: uid });
    }

    // Channel restrictions
    if (inputs.channelRestrictions && inputs.channelRestrictions.length > 0) {
      var channelNames = [];
      inputs.channelRestrictions.map(channel => {
        var theChannel = inputs.guild.channels.resolve(channel)

        if (theChannel) {
          channelNames.push(theChannel.name);
          theChannel.createOverwrite(inputs.user, {
            VIEW_CHANNEL: false
          }, `Discipline case ${uid}`);
        }
      });
      msg.addField(`:lock_with_ink_pen: **You have been removed from one or more channels**`, `You can no longer access the following channels indefinitely: ${channelNames.join(", ")}`);
    }

    // Roles
    if (inputs.rolesAdded && inputs.rolesAdded.length > 0) {
      var roleNames = [];
      inputs.rolesAdded.map((permission, index) => {
        var theRole = inputs.guild.roles.resolve(permission)

        if (theRole) {
          roleNames.push(theRole.name);
          if (guildMember) {
            guildMember.roles.add(theRole, `Discipline case ${inputs.case}`);
          } else {
            var roles = inputs.user.guildSettings(inputs.guild.id).roles;
            roles.push(theRole.id);
            Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { roles: roles });
          }
        }
      })
      msg.addField(`:closed_lock_with_key: **Roles were added**`, `These roles have been added to you: ${roleNames.join(", ")}`);
    }
    if (inputs.rolesRemoved && inputs.rolesRemoved.length > 0) {
      var roleNames = [];
      inputs.rolesRemoved.map((permission, index) => {
        var theRole = inputs.guild.roles.resolve(permission)

        if (theRole) {
          roleNames.push(theRole.name);
          if (guildMember) {
            guildMember.roles.remove(theRole, `Discipline case ${inputs.case}`);
          } else {
            var roles = inputs.user.guildSettings(inputs.guild.id).roles;
            roles = roles.filter((role) => role.id !== theRole.id)
            Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { roles: roles });
          }
        }
      })
      msg.addField(`:closed_lock_with_key: **Roles were removed**`, `These roles have been removed from you: ${roleNames.join(", ")}`);
    }

    // Add bot restrictions
    if (inputs.cannotUseVoiceChannels && guildMember) {
      guildMember.voice.setDeaf(true, 'User disciplined with cannotUseVoiceChannels restriction.');
      guildMember.voice.setMute(true, 'User disciplined with cannotUseVoiceChannels restriction.');
    }
    if (inputs.cannotUseVoiceChannels) {
      msg.addField(`:lock: **Cannot use the voice channels anymore**`, `Your access to all voice channels has been revoked indefinitely.`);
    }
    if (inputs.cannotGiveReputation) {
      msg.addField(`:lock: **Cannot give reputation anymore**`, `You are no longer able to give members reputation via the reputation command nor the reaction.`);
    }
    if (inputs.cannotUseStaffCommand) {
      msg.addField(`:lock: **Cannot use the staff command anymore**`, `You can no longer use the staff command to create channels with staff. If you need staff for any reason, you must send a DM.`);
    }
    if (inputs.cannotUseReportCommand) {
      msg.addField(`:lock: **Cannot use the report command anymore**`, `You can no longer use the report command to self-moderate troublesome members. But you can still notify staff of problematic members.`);
    }
    if (inputs.cannotUseSupportCommand) {
      msg.addField(`:lock: **Cannot use the support command anymore**`, `You can no longer use the support command to create opt-in channels to discuss sensitive support topics. If you need support, you can DM a member with their permission.`);
    }
    if (inputs.cannotUseConflictCommand) {
      msg.addField(`:lock: **Cannot use the conflict command anymore**`, `You can no longer use the conflict command. If a fight is occurring in the guild, you can still notify staff about it.`);
    }
    if (inputs.cannotPurchaseAds) {
      msg.addField(`:lock: **Cannot purchase ads anymore**`, `You are no longer allowed to advertise in this guild, even with the ad command.`);
    }
    if (inputs.cannotEditProfile) {
      msg.addField(`:lock: **Cannot edit profile anymore**`, `You are no longer allowed to edit your profile. Please contact staff if you have something important that needs changed on your profile.`);
    }

    // Check class D discipline
    classD();

    // remove XP
    if (inputs.XP > 0) {
      msg.addField(`:fleur_de_lis: **${inputs.XP} XP has been retracted from you**`, `You now have ${(inputs.user.guildSettings(inputs.guild.id).XP - inputs.XP)} XP.`);
      Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { XP: inputs.user.guildSettings(inputs.guild.id).XP - inputs.XP });

      if (guildMember)
        await sails.helpers.xp.checkRoles(guildMember);
    }

    // remove credits
    if (inputs.credits > 0) {
      msg.addField(`:gem: **You were fined $${inputs.credits / 100} SRD**`, `You now have $${(inputs.user.guildSettings(inputs.guild.id).credits - inputs.credits) / 100} SRD.`);
      Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { credits: inputs.user.guildSettings(inputs.guild.id).credits - inputs.credits });
    }

    // HP damage
    if (inputs.damage > 0) {
      var HP = inputs.user.guildHP(inputs.guild.id);
      HP = HP - inputs.damage;
      if (HP <= 0) {
        msg.addField(`:broken_heart: **You were given ${inputs.damage} HP damage**`, `You now have 0 HP.` + "\n" + `:warning: **You do not have any HP left!** This means any additional rule violations can result in a temporary or permanent ban at staff discretion.`);
      } else {
        msg.addField(`:broken_heart: **You were given ${inputs.damage} HP damage**`, `You now have ${HP} HP.` + "\n" + `Bans are not considered / issued except for violations of the zero tolerance policy unless you lose all your HP. You will regenerate 1 HP for every ${inputs.guild.settings.XPForOneHP} XP you earn.`);
      }
      Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { damage: inputs.user.guildSettings(inputs.guild.id).damage + inputs.damage });
    }

    // Additional info
    if (inputs.additionalInformation) {
      msg.addField(`:notepad_spiral: **Additional information or discipline**`, inputs.additionalInformation);
    }

    // If the member is no longer in the guild, issue the ban or tempban immediately, and undo the mute
    if (!guildMember) {
      if (inputs.banDuration !== null) {
        // Apply the ban
        await inputs.guild.members.ban(inputs.user, { days: 7, reason: inputs.reason });
        if ((!inputs.apologies && !inputs.research && !inputs.retraction && !inputs.quizzes) || inputs.banDuration === 0) {
          Caches.get('members').set([ inputs.user.id, inputs.guild.id ], { muted: false });
        }

        // Add a schedule if the ban is limited duration
        if (inputs.banDuration > 0) {
          await sails.models.schedules.create({
            uid: uid,
            task: 'removeBan',
            data: {
              user: inputs.user.id,
              guild: inputs.guild.id
            },
            nextRun: moment().add(inputs.banDuration, 'days').toISOString(true)
          });
          Caches.get('moderation').set([ uid ], { schedule: uid });
        }
      }
    }

    // Add raid score
    switch (inputs.type) {
      case 'Warning':
      case 'Basic Discipline':
        await sails.helpers.guild.addRaidScore(inputs.guild, 10);
        break;
      case 'Antispam Discipline':
      case 'Reflection / Research':
      case 'Access Restrictions':
        await sails.helpers.guild.addRaidScore(inputs.guild, 20);
        break;
      case 'Ban':
      case 'Investigation':
        await sails.helpers.guild.addRaidScore(inputs.guild, 30);
        break;
      default:
        await sails.helpers.guild.addRaidScore(inputs.guild, 10);
        break;
    }

    // Post in the incidents channel
    inputs.channel.send(`<@${inputs.user.id}>, you have been issued a disciplinary notice. It is posted as an embed below.
        If you cannot see the information below, please go in your Discord settings -> App Settings -> Text & Images, and enable the __Show website preview info from links pasted into chat__ option.`, {
      split: true,
      embed: msg
    });

    // Post in the mod log channel
    await sails.helpers.guild.send('modLogChannel', inputs.guild, `:warning: Discipline was issued against ${inputs.user.tag} (${inputs.user.id}). Below is an embed of their disciplinary message.`, { embed: msg })

    // Post in the public channel
    await sails.helpers.guild.send('modLogPublicChannel', inputs.guild, publicString);
  }

};

function colour (type) {
  switch (type) {
    case 'Ban':
      return "#dc3545";
    case 'Antispam Discipline':
      return '#17a2b8';
    case 'Warning':
      return "#ffc107";
    case 'Access Restrictions':
      return "#ff851b";
    case 'Reflection / Research':
      return "#605ca8";
    case 'Basic Discipline':
      return "#007bff";
    case 'Investigation':
      return "#f012be";
    default:
      return "#ffffff";
  }
}