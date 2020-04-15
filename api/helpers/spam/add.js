module.exports = {


  friendlyName: 'spam.add',


  description: 'Add spam score.',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: "The member to add spam score to"
    },
    amount: {
      type: 'number',
      min: 0,
      required: true,
      description: "Amount of score to add"
    },
    message: {
      type: 'ref',
      description: "If inputs.member spam score was added from a message, provide the message."
    }
  },


  fn: async function (inputs) {
    // Ignore if score = 0
    if (inputs.amount === 0)
      return null;

    // Ignore bot
    if (typeof inputs.message !== `undefined` && inputs.message.author.id === DiscordClient.user.id)
      return null;

    // Update the score
    Caches.get('members').set([ inputs.member.id, inputs.member.guild.id ], () => {
      var isMuted = (inputs.member.guild.settings.muteRole && inputs.member.roles.cache.get(inputs.member.guild.settings.muteRole));
      var currentScore = inputs.member.settings.spamScore;
      var newScore = currentScore + inputs.amount;

      var modifier = { spamScore: inputs.member.settings.spamScore + inputs.amount };

      // Check if the score has been breached
      if (currentScore < 100 && newScore >= 100) {
        if (inputs.member.settings.spamScoreStamp === null || moment().subtract(1, 'minutes').isAfter(moment(inputs.member.settings.spamScoreStamp))) {
          if (inputs.message) {
            var response = `:warning: <@${inputs.message.author.id}> **__Antispam__: Please take a break from sending/editing messages or adding reactions for about ${moment.duration(inputs.member.guild.settings.antispamCooldown > 0 ? (newScore / inputs.member.guild.settings.antispamCooldown) + 1 : 0, 'minutes').format("m [Minutes]")}**. `;
            if (isMuted) {
              response += `**Otherwise, I'll have to kick you from the guild, causing any pending bans to apply and you to lose any opportunity to appeal active discipline**.`;
            } else if (inputs.member.guild.settings.raidMitigation >= 3) {
              response += `__**Otherwise, I'll have to permanently ban you.**__`;
            } else if (inputs.member.guild.settings.raidMitigation >= 2) {
              response += `**Otherwise, I'll have to issue you a temporary ban for 24 hours.**`;
            } else if (inputs.member.guild.settings.raidMitigation >= 1) {
              response += `Otherwise, I'll have to mute you.`;
            } else {
              response += `Otherwise, I'll have to mute you for 30 minutes.`;
            }
            inputs.message.send(response);
          }
        }
        modifier.spamScoreStamp = moment().toISOString(true);
      } else if (currentScore >= 100 && moment().subtract(10, 'seconds').isAfter(moment(inputs.member.settings.spamScoreStamp))) {

        // Reset the member's spam score
        modifier.spamScore = 0;

        // If user is muted already, kick the user and end here
        if (isMuted) {
          inputs.member.kick(`Triggered antispam while being muted.`);
          return null;
        }

        // Determine if a mute should be untimed based on HP.
        var HP = inputs.member.HP;
        var HPThreshold = HP <= 0

        // Issue the mute
        if (inputs.member.guild.settings.raidMitigation < 1 && !HPThreshold) {
          (async () => {
            var channel = await sails.helpers.incidents.createChannel('discipline', inputs.member.guild, [ inputs.member ]);
            await sails.helpers.discipline.add.with({
              channel: channel,
              user: inputs.member.user,
              guild: inputs.member.guild,
              issuer: DiscordClient.user,
              // Discipline-specific inputs
              type: 'Antispam Discipline',
              rules: [ inputs.member.guild.settings.antispamRuleNumber ],
              reason: `You were asked by the bot's antispam system to take a break from the guild for a few minutes. You neglected to cooperate.`,
              additionalInformation: null,
              XP: 0,
              credits: 1000,
              damage: 10,
              apologies: null,
              research: null,
              retractions: null,
              quizzes: null,
              muteDuration: 30,
              channelRestrictions: null,
              rolesAdded: null,
              rolesRemoved: null,
              cannotUseVoiceChannels: false,
              cannotGiveReputation: false,
              cannotUseStaffCommand: false,
              cannotUseReportCommand: false,
              cannotUseSupportCommand: false,
              cannotUseConflictCommand: false,
              cannotPurchaseAds: false,
              cannotEditProfile: false,
              banDuration: null
            });
          })();
        } else if (inputs.member.guild.settings.raidMitigation < 1 && HPThreshold) {
          (async () => {
            var channel = await sails.helpers.incidents.createChannel('discipline', inputs.member.guild, [ inputs.member ]);
            await sails.helpers.discipline.add.with({
              channel: channel,
              user: inputs.member.user,
              guild: inputs.member.guild,
              issuer: DiscordClient.user,
              // Discipline-specific inputs
              type: 'Antispam Discipline',
              rules: [ inputs.member.guild.settings.antispamRuleNumber ],
              reason: `You were asked by the bot's antispam system to take a break from the guild for a few minutes. You neglected to cooperate.`,
              additionalInformation: `You do not have any HP left, which may necessitate a temporary or permanent ban. Staff will review the incident and make a decision.`,
              XP: 0,
              credits: 1000,
              damage: 10,
              apologies: null,
              research: null,
              retractions: null,
              quizzes: null,
              muteDuration: 0,
              channelRestrictions: null,
              rolesAdded: null,
              rolesRemoved: null,
              cannotUseVoiceChannels: false,
              cannotGiveReputation: false,
              cannotUseStaffCommand: false,
              cannotUseReportCommand: false,
              cannotUseSupportCommand: false,
              cannotUseConflictCommand: false,
              cannotPurchaseAds: false,
              cannotEditProfile: false,
              banDuration: null
            });
          })();
        } else if (inputs.member.guild.settings.raidMitigation < 2) {
          (async () => {
            var channel = await sails.helpers.incidents.createChannel('discipline', inputs.member.guild, [ inputs.member ]);
            await sails.helpers.discipline.add.with({
              channel: channel,
              user: inputs.member.user,
              guild: inputs.member.guild,
              issuer: DiscordClient.user,
              // Discipline-specific inputs
              type: 'Antispam Discipline',
              rules: [ inputs.member.guild.settings.antispamRuleNumber ],
              reason: `You were asked by the bot's antispam system to take a break from the guild for a few minutes. You neglected to cooperate, and level 1 raid mitigation was in effect.`,
              additionalInformation: HPThreshold ? `You do not have any HP left, which may necessitate a temporary or permanent ban. Staff will review the incident and make a decision.` : null,
              XP: 0,
              credits: 1000,
              damage: 10,
              apologies: null,
              research: null,
              retractions: null,
              quizzes: null,
              muteDuration: 0,
              channelRestrictions: null,
              rolesAdded: null,
              rolesRemoved: null,
              cannotUseVoiceChannels: false,
              cannotGiveReputation: false,
              cannotUseStaffCommand: false,
              cannotUseReportCommand: false,
              cannotUseSupportCommand: false,
              cannotUseConflictCommand: false,
              cannotPurchaseAds: false,
              cannotEditProfile: false,
              banDuration: null
            });
          })();
        } else if (inputs.member.guild.settings.raidMitigation < 3) {
          (async () => {
            var channel = await sails.helpers.incidents.createChannel('discipline', inputs.member.guild, [ inputs.member ]);
            await sails.helpers.discipline.add.with({
              channel: channel,
              user: inputs.member.user,
              guild: inputs.member.guild,
              issuer: DiscordClient.user,
              // Discipline-specific inputs
              type: 'Antispam Discipline',
              rules: [ inputs.member.guild.settings.antispamRuleNumber ],
              reason: `You were asked by the bot's antispam system to take a break from the guild for a few minutes. You neglected to cooperate, and level 2 raid mitigation was in effect.`,
              additionalInformation: HPThreshold ? `You do not have any HP left, which may necessitate a permanent ban. Staff will review the incident and make a decision.` : null,
              XP: 0,
              credits: 1000,
              damage: 10,
              apologies: null,
              research: null,
              retractions: null,
              quizzes: null,
              muteDuration: null,
              channelRestrictions: null,
              rolesAdded: null,
              rolesRemoved: null,
              cannotUseVoiceChannels: false,
              cannotGiveReputation: false,
              cannotUseStaffCommand: false,
              cannotUseReportCommand: false,
              cannotUseSupportCommand: false,
              cannotUseConflictCommand: false,
              cannotPurchaseAds: false,
              cannotEditProfile: false,
              banDuration: 1
            });
          })();
        } else if (inputs.member.guild.settings.raidMitigation >= 3) {
          (async () => {
            var channel = await sails.helpers.incidents.createChannel('discipline', inputs.member.guild, [ inputs.member ]);
            await sails.helpers.discipline.add.with({
              channel: channel,
              user: inputs.member.user,
              guild: inputs.member.guild,
              issuer: DiscordClient.user,
              // Discipline-specific inputs
              type: 'Antispam Discipline',
              rules: [ inputs.member.guild.settings.antispamRuleNumber ],
              reason: `You were asked by the bot's antispam system to take a break from the guild for a few minutes. You neglected to cooperate, and level 3 raid mitigation was in effect.`,
              additionalInformation: null,
              XP: 0,
              credits: 1000,
              damage: 10,
              apologies: null,
              research: null,
              retractions: null,
              quizzes: null,
              muteDuration: null,
              channelRestrictions: null,
              rolesAdded: null,
              rolesRemoved: null,
              cannotUseVoiceChannels: false,
              cannotGiveReputation: false,
              cannotUseStaffCommand: false,
              cannotUseReportCommand: false,
              cannotUseSupportCommand: false,
              cannotUseConflictCommand: false,
              cannotPurchaseAds: false,
              cannotEditProfile: false,
              banDuration: 0
            });
          })();
        }
      }

      return modifier;
    });

  }


};

