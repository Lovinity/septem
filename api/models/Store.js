/**
 * Store.js
 *
 * @description :: A list of guilds and their Yang store settings.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: guildID should be the only required attribute; try to define defaultsTosTo where applicable
    guildID: {
      type: 'string',
      required: true,
      unique: true
    },

    command_generator: {
      type: 'number',
      min: 0,
      defaultsTo: 5
    },

    command_nick: {
      type: 'number',
      min: 0,
      defaultsTo: 25
    },

    command_remindme: {
      type: 'number',
      min: 0,
      defaultsTo: 25
    },

    command_rep: {
      type: 'number',
      min: 0,
      defaultsTo: 50
    },

    command_8ball: {
      type: 'number',
      min: 0,
      defaultsTo: 5
    },

    command_choice: {
      type: 'number',
      min: 0,
      defaultsTo: 5
    },

    command_markov: {
      type: 'number',
      min: 0,
      defaultsTo: 10
    },

    command_ad: {
      type: 'number',
      min: 0,
      defaultsTo: 100
    },

    command_ad_mention: {
      type: 'number',
      min: 0,
      defaultsTo: 250
    },

    command_fact: {
      type: 'number',
      min: 0,
      defaultsTo: 10
    },

    command_superpower: {
      type: 'number',
      min: 0,
      defaultsTo: 10
    },

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('store', 'store', data)
    ModelCache.store[ newlyCreatedRecord.guildID ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('store', 'store', data)
    ModelCache.store[ updatedRecord.guildID ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('store', 'store', data)
    delete ModelCache.store[ destroyedRecord.guildID ];

    return proceed()
  }
};

