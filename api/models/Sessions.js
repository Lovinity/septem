/**
 * Sessions.js
 *
 * @description :: Role play sessions
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    guildID: {
      type: 'string',
      required: true,
    },

    active: {
      type: 'boolean',
      defaultsTo: true
    },

    gameMasters: {
      type: 'json',
      required: true,
      description: 'Array of game masters (user IDs) in charge of this session.'
    },

    participants: {
      type: 'json',
      description: 'Array of character IDs of the characters participating in this session.'
    },

    campaignTime: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
      description: 'The current date/time of the session.'
    },

    antagonistMP: {
      type: 'number',
      min: 0,
      defaultsTo: 50,
      description: 'Amount of MP available for the antagonist team.'
    },

    protagonistMP: {
      type: 'number',
      min: 0,
      defaultsTo: 50,
      description: 'Amount of MP available to the protagonist team.'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('sessions', 'sessions', data)
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].sessions === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].sessions = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].sessions[ newlyCreatedRecord.ID ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('sessions', 'sessions', data)
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].sessions === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].sessions = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].sessions[ updatedRecord.ID ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('sessions', 'sessions', data)
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].sessions === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].sessions = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].sessions[ destroyedRecord.ID ];

    return proceed()
  }

};

