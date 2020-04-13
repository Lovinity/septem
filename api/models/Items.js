/**
 * Items.js
 *
 * @description :: A model definition represents a database table/collection.
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

    characterID: {
      type: 'string',
      allowNull: true,
      description: 'If this item is specific to a character, this is the ID of that character.'
    },

    name: {
      type: 'string',
      maxLength: 64,
      description: 'Name of the item',
      required: true
    },

    image: {
      type: 'string',
      allowNull: true,
      description: 'image name of the item if an image was provided.'
    },

    type: {
      type: 'string',
      isIn: ['Earth', 'LM'],
      required: true,
      description: 'Does this item exist on Earth or LM?'
    },

    info: {
      type: 'string',
      maxLength: 2048,
      allowNull: true,
      description: 'Background information about this item.'
    },

    uses: {
      type: 'json',
      description: 'Array of things this item can do, including dice rolls/modifiers and EP costs when applicable.'
    },

    maxEP: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'The maximum / starting EP for this item. Use 0 if this item does not use EP.'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('items', 'items', data)
    Caches.set('items', newlyCreatedRecord);

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('items', 'items', data)
    Caches.set('items', updatedRecord);

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('items', 'items', data)
    Caches.del('items', destroyedRecord);

    return proceed()
  }

};

