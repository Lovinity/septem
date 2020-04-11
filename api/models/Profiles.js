/**
 * Profiles.js
 *
 * @description :: A collection of profiles for each guild member.
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

    title: {
      type: 'string',
      maxLength: 64,
      allowNull: true,
      description: 'Short motto or phrase displayed below the username on profile pages.'
    },

    dateOfBirth: {
      type: 'ref',
      columnType: 'date',
      description: 'Date of birth for the member'
    },

    location: {
      type: 'string',
      maxLength: 128,
      allowNull: true,
      description: 'The physical location of the member on Earth.'
    },

    background: {
      type: 'string',
      allowNull: true,
      isURL: true,
      description: 'URL to an image to use as the cover on the member profile.'
    },

    info: {
      type: 'string',
      maxLength: 2048,
      allowNull: true,
      description: 'Additional HTML-styled profile information for the member.'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('profiles', 'profiles', data)
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].profiles === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].profiles = {};
    }
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].profiles[ newlyCreatedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].profiles[ newlyCreatedRecord.userID ] = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].profiles[ newlyCreatedRecord.userID ].profile = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('profiles', 'profiles', data)
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].profiles === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].profiles = {};
    }
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].profiles[ updatedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].profiles[ updatedRecord.userID ] = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].profiles[ updatedRecord.userID ].profile = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('profiles', 'profiles', data)
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].profiles === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].profiles = {};
    }
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].profiles[ destroyedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].profiles[ destroyedRecord.userID ] = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].profiles[ destroyedRecord.userID ].profile;

    return proceed()
  }

};

