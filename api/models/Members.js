/**
 * Members.js
 *
 * @description :: A collection of guild members and their stats.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: guildID and userID should never be unique because the same user could exist in multiple guilds.
    userID: {
      type: 'string',
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    XP: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Experience points, earned through sending non-spammy messages and participating in voice channels.'
    },

    credits: {
      type: 'number',
      defaultsTo: 0,
      description: 'Virtual guild currency. Members earn 1 credit for every XP. Can be spent on various things at guild staff discretion.'
    },

    damage: {
      type: 'number',
      defaultsTo: 0,
      description: 'Total HP damage this member received through discipline.'
    },

    reputation: {
      type: 'number',
      defaultsTo: 0,
      description: 'Reputation points the member has earned.'
    },

    spamScore: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Members earn spam score for their messages; the more spammy, the more points. Breaking 100 triggers an antispam verbal warning, continuing without waiting a few minutes results in antispam discipline.'
    },

    lastActive: {
      type: 'ref',
      columnType: 'datetime',
      description: 'Date/time of the most recent message the member sent or when they were last detected in an active voice channel.'
    },

    activityScore: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Members earn 1 activity score for every XP. Activity score decays at a rate of 0.1% per minute.'
    },

    verified: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Whether or not this member has been verified.'
    },

    lastRep: {
      type: 'ref',
      columnType: 'datetime',
      description: 'The last date/time this member used the rep command.'
    },

    muted: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Whether or not this member is supposed to be muted'
    },

    reports: {
      type: 'json',
      description: 'Array of objects of active reports against this member: {user: userID, time: datetime}.'
    },

    roles: {
      type: 'json',
      description: 'Array of role IDs assigned to this member.'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('members', 'members', data)
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].members = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('members', 'members', data)
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].members = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('members', 'members', data)
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].members = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ];

    return proceed()
  }

};

