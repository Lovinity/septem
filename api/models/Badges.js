/**
 * Badges.js
 *
 * @description :: A collection of profile badges
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    uid: {
      type: 'string',
      unique: true,
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    name: {
      type: 'string',
      required: true
    },

    howToEarn: {
      type: 'string',
      allowNull: true
    },

    price: {
      type: 'number',
      min: 0,
      allowNull: true
    },

    filename: {
      type: 'string',
      required: true
    },

    active: {
      type: 'boolean',
      defaultsTo: true
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('badges', 'badges', data)
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].badges === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].badges = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].badges[ newlyCreatedRecord.uid ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('badges', 'badges', data)
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].badges === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].badges = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].badges[ updatedRecord.uid ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('badges', 'badges', data)
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].badges === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].badges = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].badges[ destroyedRecord.uid ];

    return proceed()
  }

};

