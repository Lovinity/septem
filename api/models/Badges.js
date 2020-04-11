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
    ModelCache.badges[ newlyCreatedRecord.uid ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('badges', 'badges', data)
    ModelCache.badges[ updatedRecord.uid ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('badges', 'badges', data)
    delete ModelCache.badges[ destroyedRecord.uid ];

    return proceed()
  }

};

