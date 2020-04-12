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
    Caches.set('ads', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('ads', 'ads', data)
    Caches.set('ads', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('ads', 'ads', data)
    Caches.del('ads', destroyedRecord);

    return proceed()
  }

};

