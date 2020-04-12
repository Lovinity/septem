/**
 * Roles.js
 *
 * @description :: A list of Discord roles and their settings.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // API note: only roleID and guildID should be required. Set defaultsTo where possible.
    roleID: {
      type: 'string',
      required: true,
      unique: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    antispamLessStrict: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Set to true if members with this role should have less spamScore added to them. If the member has multiple lessStrict roles, they do NOT compound.'
    },

    selfRoleCategory: {
      type: 'string',
      allowNull: true,
      description: 'If this role can be self-assigned, name of the category of roles this falls in.'
    },

    selfReaction: {
      type: 'string',
      allowNull: true,
      description: 'If this role can be self-assigned, ID of the emoji to use for the reaction. Must not share the same emoji with another role in the same category.'
    },

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('roles', 'roles', data)
    Caches.set('roles', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('roles', 'roles', data)
    Caches.set('roles', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('roles', 'roles', data)
    Caches.del('roles', destroyedRecord);

    return proceed()
  }

};

