/**
 * Sessions.js
 *
 * @description :: Campaigns
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

    campaignTime: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
      description: 'The current date/time of the session.'
    },

    antagonistCP: {
      type: 'number',
      min: 0,
      defaultsTo: 50,
      description: 'Amount of CP available for the antagonist team.'
    },

    protagonistCP: {
      type: 'number',
      min: 0,
      defaultsTo: 50,
      description: 'Amount of CP available to the protagonist team.'
    },

    sessionActive: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Is a session active for this campaign?'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('campaigns', 'campaigns', data)
    Caches.set('campaigns', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('campaigns', 'campaigns', data)
    Caches.set('campaigns', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('campaigns', 'campaigns', data)
    Caches.del('campaigns', destroyedRecord);

    return proceed()
  }

};

