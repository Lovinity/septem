/**
 * Guilds.js
 *
 * @description :: A model definition represents a database table/collection.
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
      allowNull: true
    }

  },

    // Websockets and cache standards
    afterCreate: function (newlyCreatedRecord, proceed) {
      var data = { insert: newlyCreatedRecord }
      sails.sockets.broadcast('guilds', 'guilds', data)
      ModelCache.guilds[ newlyCreatedRecord.guildID ] = newlyCreatedRecord;
  
      return proceed()
    },
  
    afterUpdate: function (updatedRecord, proceed) {
      var data = { update: updatedRecord }
      sails.sockets.broadcast('guilds', 'guilds', data)
      ModelCache.guilds[ updatedRecord.guildID ] = updatedRecord;
  
      return proceed()
    },
  
    afterDestroy: function (destroyedRecord, proceed) {
      var data = { remove: destroyedRecord.ID }
      sails.sockets.broadcast('guilds', 'guilds', data)
      delete ModelCache.guilds[ destroyedRecord.guildID ];
  
      return proceed()
    }

};

