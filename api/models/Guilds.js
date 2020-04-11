/**
 * Guilds.js
 *
 * @description :: A list of Discord guilds and their settings
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: guildID should be the only required attribute; try to define defaultsTo where applicable
    guildID: {
      type: 'string',
      required: true,
      unique: true
    },

    prefix: {
      type: 'string',
      allowNull: true,
      description: 'Change the bot prefix on a per-guild bases by specifying a new prefix.'
    },

    incidentsCategory: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the category to create private member/staff channels.'
    },

    staffCategory: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the category containing staff-only channels; staff commands are restricted to these.'
    },

    botChannel: {
      type: 'string',
      allowNull: true,
      description: 'The channel ID designated for bot commands. Most commands are restricted to use in this channel if provided.'
    },

    botGamesChannel: {
      type: 'string',
      allowNull: true,
      description: 'The channel ID used for posting routine bot games to play for credits.'
    },

    modLogChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel to post moderation logs (should be restricted to staff only), such as issued discipline, bans, and member kicks.'
    },

    modLogPublicChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel visible by everyone to post very broad messages when discipline is issued; so members know justice is served.'
    },

    eventLogChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel to post events not covered by Discord audit logs, such as message/avatar/username/nickname changes.'
    },

    flagLogChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel to post things moderators should be aware of, such as high-spam messages, members who join with prior discipline or an account that is new, etc'
    },

    iceBreakerChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel for posting periodic random ice breaker questions for others to answer.'
    },

    announcementsChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel used to post announcements. Bot will post announcements, such as raid mitigation, here.'
    },

    generalChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel for the lobby / general chat. This is where new member messages will be posted.'
    },

    unverifiedChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel new members can post to before they are verified.'
    },

    starboardChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel where high-rep messages will be featured.'
    },

    selfRolesChannel: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the channel the bot will use for posting roles people can self-assign with reactions.'
    },

    statsMessage: {
      type: 'string',
      allowNull: true,
      description: 'The channelID.messageID of the message authored by the bot to edit with the current guild stats every minute.'
    },

    repEmoji: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the emoji used for reputation. The bot will react to messages qualifying for rep with this emoji. Others who also react will increase the member reputation.'
    },

    muteRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role assigned when a member is muted.'
    },

    modRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role designating the moderators; they are allowed to use moderation commands involving discipline.'
    },

    staffRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role assigned to all staff members.'
    },

    GMRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role assigned to the active Game Masters. They have the ability to modify character stats etc during a campaign.'
    },

    inactiveRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role assigned when a member becomes inactive.'
    },

    verifiedRole: {
      type: 'string',
      allowNull: true,
      description: 'The ID of the role assigned when a member is verified. Also used to check and reassign saved roles.'
    },

    levelRoles: {
      type: 'json',
      description: 'An array of key: level, value: role ID to assign the provided role when the user reaches the provided level.'
    },

    conflictResolutionMembers: {
      type: 'number',
      allowNull: true,
      min: 1,
      defaultsTo: 3,
      description: 'The number of non-staff members that must issue the conflict command within conflictResolutionTime for conflict resolution to initiate.'
    },

    conflictResolutionTime: {
      type: 'number',
      allowNull: true,
      min: 1,
      defaultsTo: 15,
      description: 'The number of minutes an execution of the conflict command is valid before it expires.'
    },

    reportMembers: {
      type: 'number',
      allowNull: true,
      min: 1,
      defaultsTo: 3,
      description: 'The number of members that must report someone within reportTime for a member to be auto-muted for investigation.'
    },

    reportTime: {
      type: 'number',
      allowNull: true,
      min: 1,
      defaultsTo: 60,
      description: 'The number of minutes before a member report expires.'
    },

    starboardRep: {
      type: 'number',
      allowNull: true,
      min: 1,
      defaultsTo: 3,
      description: 'The minimum reputation on a message required for it to be featured on the starboard.'
    },

    // TODO: highestActivityScore?

    antispamCooldown: {
      type: 'number',
      allowNull: true,
      min: 1,
      max: 100,
      defaultsTo: 33,
      description: 'The number of spamScore points removed from every member each minute.'
    },

    antispamRuleNumber: {
      type: 'number',
      allowNull: true,
      description: 'The rule number specifying spamming is not allowed; used in discipline issued by the bot for spamming.'
    },

    raidScore: {
      type: 'number',
      defaultsTo: 0,
      min: 0,
      description: 'The raid score for this guild which determines when raid mitigation is activated.'
    },

    raidMitigation: {
      type: 'number',
      defaultsTo: 0,
      min: 0,
      max: 3,
      description: 'The raid mitigation level currently active.'
    },

    XPForOneHP: {
      type: 'number',
      defaultsTo: 50,
      min: 1,
      description: 'The amount of XP required for a member to earn 1 HP.'
    },

  },

    // Websockets and cache standards
    afterCreate: async function (newlyCreatedRecord, proceed) {
      var data = { insert: newlyCreatedRecord }
      sails.sockets.broadcast('guilds', 'guilds', data)
      ModelCache.guilds[ newlyCreatedRecord.guildID ] = newlyCreatedRecord;

      // Create store
      await sails.models.store.findOrCreate({guildID: newlyCreatedRecord.guildID}, {guildID: newlyCreatedRecord.guildID});
  
      return proceed()
    },
  
    afterUpdate: async function (updatedRecord, proceed) {
      var data = { update: updatedRecord }
      sails.sockets.broadcast('guilds', 'guilds', data)
      ModelCache.guilds[ updatedRecord.guildID ] = updatedRecord;
  
      return proceed()
    },
  
    afterDestroy: async function (destroyedRecord, proceed) {
      var data = { remove: destroyedRecord.id }
      sails.sockets.broadcast('guilds', 'guilds', data)
      delete ModelCache.guilds[ destroyedRecord.guildID ];

      // Destroy store
      await sails.models.store.destroy({guildID: destroyedRecord.guildID}).fetch();
  
      return proceed()
    }

};

