/**
 * Participants.js
 *
 * @description :: Characters / items in a role play session. Also allows for multiple instances of the same character/item.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    campaignID: {
      type: 'number',
      required: true
    },

    type: {
      type: 'string',
      isIn: ['character', 'item'],
      required: true,
      description: 'Is this a character or an item?'
    },

    instanceID: {
      type: 'number',
      required: true,
      description: 'ID of the character or the item'
    },

    location: {
      type: 'string',
      allowNull: true,
      description: 'A description of the current location of the character or item.'
    },

    possessedBy: {
      type: 'number',
      allowNull: true,
      description: 'If this item or character is in the grasp of another character, this is the participant ID of that character.'
    },

    HP: {
      type: 'number',
      min: 0,
      defaultsTo: 50,
      description: 'Hit points / health of the character / item for this session.'
    },

    EP: {
      type: 'number',
      min: 0,
      defaultsTo: 25,
      description: 'Energy points for the character / item for this session.'
    },

    inSession: {
      type: 'boolean',
      defaultsTo: false,
      description: 'Is this participant in an active session?'
    },

    sessionNotes: {
      type: 'json',
      description: 'Array of notes specific to this session for this character.'
    }

  },

};

