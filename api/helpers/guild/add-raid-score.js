module.exports = {


  friendlyName: 'guild.addRaidScore',


  description: 'Increase a Discord guild raid score and activate mitigation if necessary.',


  inputs: {
    guild: {
      type: 'ref',
      required: true,
      description: 'The guild object'
    },
    amount: {
      type: 'number',
      min: 0,
      description: "Amount of raid score to add."
    }
  },


  fn: async function (inputs) {

    // Update the score.
    var currentScore = inputs.guild.settings.raidScore;
    var newScore = currentScore + score;
    Caches.get('guilds').set([ inputs.guild.id ], () => {
      return { raidScore: newScore };
    });

    var mitigation = inputs.guild.settings.raidMitigation;

    // Activate raid mitigation if necessary
    if (newScore >= 60 && mitigation < 1) {
      await inputs.guild.setVerificationLevel(3)
      Caches.get('guilds').set([ inputs.guild.id ], () => {
        return { raidMitigation: 1 };
      });

      await sails.helpers.guild.send('announcementsChannel', inputs.guild, `:rotating_light: **Raid mitigation level 1 activated** :rotating_light:

      I have detected a potential raid. As a precaution, level 1 mitigation has been activated. Until raid mitigation ends: New members will remain unverified until raid mitigation ends. New members cannot send messages for the first 10 minutes of joining. And antispam discipline will result in an untimed mute.`);
    }
    if (newScore >= 120 && mitigation < 2) {
      await inputs.guild.setVerificationLevel(4)
      Caches.get('guilds').set([ inputs.guild.id ], () => {
        return { raidMitigation: 2 };
      });
      await sails.helpers.guild.send('announcementsChannel', inputs.guild, `:rotating_light: **Raid mitigation level 2 activated** :rotating_light:

I continue to detect raid activity. As a further precaution, level 2 mitigation has been activated. Until raid mitigation ends: Members cannot join the guild without a verified phone number on their Discord account. New members will remain unverified until raid mitigation ends. And antispam discipline will result in a 24-hour ban.`);
    }
    if (newScore >= 180 && mitigation < 3) {
      Caches.get('guilds').set([ inputs.guild.id ], () => {
        return { raidMitigation: 3 };
      });
      await sails.helpers.guild.send('announcementsChannel', inputs.guild, `@everyone :rotating_light: **Raid mitigation level 3 activated - All invite links deleted** :rotating_light:

Severe raid activity continues to be detected. I activated the highest mitigation level (level 3). All invite links have been deleted. Until raid mitigation ends: Members cannot join the guild; invite links created before mitigation ends will be deleted by the bot, and members who join will be kicked. And antispam discipline will result in a permanent ban.`);

      inputs.guild.fetchInvites()
        .then(invites => {
          invites.each(invite => {
            invite.delete(`Raid mitigation level 3 activated`);
          });
        })
    }
  }


};

