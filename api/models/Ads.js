/**
 * Ads.js
 *
 * @description :: A collection of Ads purchased by members.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    uid: {
      type: 'string',
      unique: true,
      required: true
    },

    userID: {
      type: 'string',
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    numPosts: {
      type: 'number',
      min: 1,
      defaultsTo: 1
    },

    nextPost: {
      type: 'ref',
      columnType: 'datetime'
    },

    hereMention: {
      type: 'boolean',
      defaultsTo: false
    },

    text: {
      type: 'string',
      required: true
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('ads', 'ads', data)
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].ads === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].ads = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].ads[ newlyCreatedRecord.uid ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('ads', 'ads', data)
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].ads === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].ads = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].ads[ updatedRecord.uid ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('ads', 'ads', data)
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].ads === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].ads = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].ads[ destroyedRecord.uid ];

    return proceed()
  }

};

