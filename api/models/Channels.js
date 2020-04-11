/**
 * Channels.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: channelID should be the only required attribute; try to define defaultsTo where applicable
    channelID: {
      type: 'string',
      required: true,
      unique: true
    },

    guildID: {
      type: 'string',
      allowNull: true
    },

    conflictResolution: {
      type: 'json'
    },

    earnXP: {
      type: 'boolean',
      defaultsTo: true,
      description: 'Set to false if messages in this channel should not earn XP.'
    },

    antispamLessStrict: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Set to true if this channel should not have as strict of spamScores assigned to its messages.'
    },

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('channels', 'channels', data)
    ModelCache.channels[ newlyCreatedRecord.channelID ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('channels', 'channels', data)
    ModelCache.channels[ updatedRecord.channelID ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('channels', 'channels', data)
    delete ModelCache.channels[ destroyedRecord.channelID ];

    return proceed()
  }

};

