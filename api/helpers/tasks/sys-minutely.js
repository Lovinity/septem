module.exports = {


  friendlyName: 'Sys minutely',


  description: 'Task run minutely by the system.',


  inputs: {

  },


  fn: async function (inputs) {
    var members = Caches.get('members').collection;

    // Decay spam scores every minute
    members
      .filter((member) => member.spamScore > 0) // Do not do anything for members with no spam score
      .each(async (member) => {
        var guild = Caches.get('guilds').find([ member.guildID ]);
        var newScore = member.spamScore - (guild.antispamCooldown || 0);
        if (newScore < 0)
          newScore = 0;

        Caches.get('members').set([ member.userID, member.guildID ], () => {
          return { spamScore: newScore };
        })
      })

    // minutely guild tasks
    DiscordClient.guilds.cache.each(async (guild) => {

      // Delete invites when raid mitigation 3+ is active
      if (guild.settings.raidMitigation >= 3) {
        guild.fetchInvites()
          .then(invites => {
            invites.each(invite => {
              invite.delete(`Raid mitigation level 3 active`);
            });
          })
      }

      // Decay raid score by 1
      if (guild.settings.raidScore > 0) {
        var newscore = guild.settings.raidScore - 1;
        if (newscore < 0)
          newscore = 0;

        Caches.get('guilds').set([ guild.id ], () => {
          return { raidScore: newscore };
        })

        if (newscore <= 0 && guild.settings.raidMitigation > 0) {

          // Add verifiedRole if applicable
          var verifiedRole = guild.roles.resolve(guild.settings.verifiedRole);
          if (verifiedRole) {
            var guildMembers = [];
            guild.members.cache.each((guildMember) => {
              if (!guildMember.roles.cache.has(verifiedRole.id) && guildMember.settings.verified) {
                guildMembers.push(guildMember.id);
                guildMember.roles.add(verifiedRole, `Raid mitigation expired`);
              }
            });
            if (guildMembers.length > 0) {
              await sails.helpers.guild.send('generalChannel', guild, `**Welcome to our new members** ${guildMembers.map((gm) => gm = `<@${gm}> `)}` + "\n\n" + `The raid has ended, and you all now have full guild access. Thank you for your patience.`);
            }
          }

          // Reset verification level to medium
          guild.setVerificationLevel(2);

          // Send announcement
          await sails.helpers.guild.send('announcementsChannel', guild, `:ballot_box_with_check: **Raid mitigation has ended** :ballot_box_with_check: 

I do not detect raid activity anymore. Raid mitigation has ended. Thank you for your patience.
              
New members who answered the verification question now have full guild access.
Guild verification is now set down to medium (must be a Discord member for 5 or more minutes).
${guild.settings.raidMitigation >= 3 ? `**Please remember to re-generate invite links**. I do not re-generate those automatically. This includes the one for the website, and for any server list bots.` : ``}`);

          // Disable mitigation in settings
          Caches.get('guilds').set([ guild.id ], () => {
            return { raidMitigation: 0 };
          })
        }
      }

      // Award voice channel XP
      guild.channels.cache
        .filter((channel) => channel.type === 'voice')
        .each(async (channel) => {
          var award = false;
          var awardTo = [];
          channel.members
            .each((guildMember) => {
              // Is the member undeaf and not a bot? They deserve a listening award!
              if (!guildMember.voice.deaf && !guildMember.user.bot)
                awardTo.push(guildMember);

              // Is the member unmuted and not a bot? Award listening XP/Yang to qualified members (if no one is unmuted, no one gets rewarded)
              // Every 3 minutes, allow for XP rewarding even if the only speaking member is a bot
              if (!guildMember.voice.mute && (!guildMember.user.bot || moment().minute() % 3 === 0))
                award = true;
            });

          // Award 15 XP to everyone if the channel as a whole qualifies
          if (award && awardTo.length > 0 && channel.members.length > 1) {
            awardTo.forEach(async (guildMember) => {
              await sails.helpers.xp.change(guildMember, 15);
            });
          }
        });
    });



    // Decay activity scores every 5 minutes
    if (moment().minute() % 5 === 0) {
      var members = Caches.get('members').collection;
      members
        .filter((member) => member.activityScore > 0) // Do not do anything for members with no spam score
        .each(async (member) => {
          var newScore = member.activityScore * (287 / 288);
          if (newScore < 1)
            newScore = 0;

          Caches.get('members').set([ member.userID, member.guildID ], () => {
            return { activityScore: newScore };
          })
        })
    }




    // Perform guild statistics calculations
    DiscordClient.guilds.cache.each((guild) => {
      if (!guild.settings.statsMessage)
        return;

      // Most active members
      var sorted = guild.members.cache.sort((a, b) => b.settings.activityScore - a.settings.activityScore);
      var activityLevel = sorted.reduce((activityLevel, member) => activityLevel + member.settings.activityScore);
      var mostActiveStaff = null;
      var mostActiveUsers = [];
      if (guild.settings.staffRole) {
        var temp = sorted.filter((member) => member.roles.cache.has(guild.settings.staffRole));
        if (temp.length > 0) {
          mostActiveStaff = temp[ 0 ].user.tag;
        }
        var temp = sorted.filter((member) => !member.roles.cache.has(guild.settings.staffRole));
        mostActiveUsers = [ temp[ 0 ] ? temp[ 0 ].user.tag : null, temp[ 1 ] ? temp[ 1 ].user.tag : null, temp[ 2 ] ? temp[ 2 ].user.tag : null ];
      } else {
        mostActiveUsers = [ sorted[ 0 ] ? sorted[ 0 ].user.tag : null, sorted[ 1 ] ? sorted[ 1 ].user.tag : null, sorted[ 2 ] ? sorted[ 2 ].user.tag : null ];
      }

      // Init embed
      var embed = new Discord.MessageEmbed()
        .setTitle(`:chart_with_upwards_trend: **Current ${guild.name} Statistics** :chart_with_upwards_trend:`)
        .setColor('#ab47bc')
        .setDescription("Statistics are automatically updated every minute.")
        .addField(`Guild Time`, moment().format('LLLL'));

      // Raid mitigation
      var raidMitigation = ``;
      var score = guild.settings.raidScore;
      var minuses = 9;
      while (score > 0) {
        minuses--;
        score -= 20;
        raidMitigation = `${raidMitigation} :warning: `
        if (minuses === 6) {
          raidMitigation = `${raidMitigation} :one: `
        } else if (minuses === 3) {
          raidMitigation = `${raidMitigation} :two: `
        } else if (minuses === 0) {
          raidMitigation = `${raidMitigation} :three: `
        }
      }
      while (minuses > 0) {
        minuses--;
        raidMitigation = `${raidMitigation} :heavy_minus_sign: `
        if (minuses === 6) {
          raidMitigation = `${raidMitigation} :one: `
        } else if (minuses === 3) {
          raidMitigation = `${raidMitigation} :two: `
        } else if (minuses === 0) {
          raidMitigation = `${raidMitigation} :three: `
        }
      }
      var raidMitigation2;
      if (_guild.settings.raidMitigation === 0)
        raidMitigation2 = `**Level 0**` + "\n" + `:black_heart: New Member Verification: Must be Discord member for 5 minutes` + "\n" + `:black_heart: New Member Participation: Immediately after answering verification question` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:black_heart: Antispam Discipline: 30-minute mute`
      if (_guild.settings.raidMitigation === 1)
        raidMitigation2 = `**Level 1**` + "\n" + `:yellow_heart: New Member Verification: Cannot send messages for first 10 minutes` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:yellow_heart: Antispam Discipline: Mute until staff remove it`
      if (_guild.settings.raidMitigation === 2)
        raidMitigation2 = `**Level 2**` + "\n" + `:heart: New Member Verification: Required Verified Phone Number` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:black_heart: Invite Links: Allowed, but deleted when member leaves guild` + "\n" + `:orange_heart: Antispam Discipline: 24-hour temp ban`
      if (_guild.settings.raidMitigation === 3)
        raidMitigation2 = `**Level 3**` + "\n" + `:heart: New Member Verification: Required Verified Phone Number` + "\n" + `:heart: New Member Participation: Isolated until Mitigation Ends` + "\n" + `:heart: Invite Links: Deleted / Not Allowed` + "\n" + `:heart: Antispam Discipline: permanent ban`
      embed.addField(`Raid Mitigation Status`, raidMitigation + "\n" + raidMitigation2);

      // Members and most active
      embed.addField(`Guild Members`, guild.members.cache.filter((member) => !member.user.bot).size);
      if (mostActiveUsers.length > 0) {
        var mostActiveUsersText = ``;
        mostActiveUsers.map((maUser, index) => {
          if (maUser)
            mostActiveUsersText += `${index + 1}. ${maUser}` + "\n";
        });
        embed.addField(`Most Active Members Recently`, mostActiveUsersText);
      }
      if (mostActiveStaff)
        embed.addField(`Most Active Staff Member Recently`, mostActiveStaff);
      embed.addField(`Guild Activity Index`, parseInt(activityLevel / guild.members.cache.filter((member) => !member.user.bot).size));

      // Update message
      var snowflakes = guild.settings.statsMessage.split(".");
      guild.channels.resolve(snowflakes[ 0 ]).messages.fetch(snowflakes[ 1 ])
        .then(message => message.edit(``, { embed: embed }));
    });




    // Hourly maintenance
    if (moment().minute() === 0) {
      // Process inactive new members
      members
        .filter((member) => member.XP === 0 && moment(member.lastActive).add(7, 'days').isBefore(moment()))
        .map(async (member) => {
          var guild = DiscordClient.guilds.resolve(member.guildID);
          if (!guild || !guild.members.cache.has(member.userID) || !guild.settings.inactiveRole || guild.members.resolve(member.userID).roles.cache.has(guild.settings.inactiveRole))
            return;

          var guildMember = guild.members.resolve(member.userID);
          guildMember.roles.add(guild.settings.inactiveRole, 'New member inactive for 7 days');
          var channel = await sails.helpers.incidents.createChannel('inactive', guild, [ guildMember ]);
          channel.send(`:zzz: **__YOU JOINED OVER 7 DAYS AGO WITHOUT SENDING YOUR FIRST MESSAGE__** :zzz:
<@${guildMember.id}> , you joined the guild over 7 days ago without sending your first message. We understand some people are shy. But to protect the guild from lurkers saving messages or planning raids, you are marked inactive and could be kicked at anytime by staff. To exit inactive status, just send a message anywhere in the guild as soon as possible. Thank you for understanding!`);

          await sails.helpers.guild.send('modLogChannel', guild, `:zzz: New member ${guildMember.user.tag} (${guildMember.id}) has joined over 7 days ago without sending their first message. Marked inactive until they do.`);
        })

      // Process inactive old members
      members
        .filter((member) => member.XP > 0 && moment(member.lastActive).add(30, 'days').isBefore(moment()))
        .map(async (member) => {
          var guild = DiscordClient.guilds.resolve(member.guildID);
          if (!guild || !guild.members.cache.has(member.userID) || !guild.settings.inactiveRole || guild.members.resolve(member.userID).roles.cache.has(guild.settings.inactiveRole))
            return;

          var guildMember = guild.members.resolve(member.userID);
          guildMember.roles.add(guild.settings.inactiveRole, 'Old member inactive for 30 days');
          var channel = await sails.helpers.incidents.createChannel('inactive', guild, [ guildMember ]);
          channel.send(`:zzz: **__YOU HAVE NOT SENT ANY MESSAGES FOR OVER 30 DAYS__** :zzz:
        <@${guildMember.id}> , we have not heard from you in over 30 days. You have been marked inactive now, and staff may kick you at any time. To exit inactive status, just send a message anywhere in the guild as soon as possible to let us know you are still here. Thanks for understanding!`);

          await sails.helpers.guild.send('modLogChannel', guild, `:zzz: Member ${guildMember.user.tag} (${guildMember.id}) has not sent any messages in the last 30 days. Marked inactive until they do.`);
        })

      DiscordClient.guilds.cache.forEach((guild) => {

        // Remove inactive support channels
        guild.channels.cache
          .filter((channel) => channel.name.startsWith("support-"))
          .each((channel) => {
            if ((!channel.lastMessage && moment(channel.createdAt).add(2, 'days').isBefore(moment())) || (channel.lastMessage && moment(channel.lastMessage.createdAt).add(2, 'days').isBefore(moment()))) {
              channel.delete(`Support channel expired (48 hours of inactivity).`);
            }
          });

        // Remove channels set to expire in 14 days
        guild.channels.cache
          .filter((channel) => channel.name.endsWith("-temp14"))
          .each((channel) => {
            if (moment(channel.createdAt).add(14, 'days').isBefore(moment())) {
              channel.delete(`Temp channel expired (14 days since it was created).`);
            }
          });

        // Remove channels set to expire after 1 day of inactivity
        guild.channels.cache
          .filter((channel) => channel.name.endsWith("-temp1"))
          .each((channel) => {
            if ((!channel.lastMessage && moment(channel.createdAt).add(1, 'days').isBefore(moment())) || (channel.lastMessage && moment(channel.lastMessage.createdAt).add(1, 'days').isBefore(moment()))) {
              channel.delete(`Temp channel expired (24 hours of inactivity).`);
            }
          });

      })
    }
  }


};

