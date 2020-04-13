/**
 * Modifiers.js
 *
 * @description :: Active modifiers (such as powerups or ailments) for participants.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    uid: {
      type: 'string',
      unique: true,
      required: true
    },

    participantID: {
      type: 'number',
      required: true,
      description: 'The ID of the participant this modifier applies to.'
    },

    name: {
      type: 'string',
      required: true,
      description: 'Description of the modifier, such as ailment or powerup.'
    },

    modifies: {
      type: 'string',
      required: true,
      isIn: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'HP', 'EP']
    },

    amount: {
      type: 'number',
      required: true,
      description: 'Amount this modifier modifies. Use a negative number to descrease or a positive number to increase.'
    },

    every: {
      type: 'number',
      min: 1,
      defaultsTo: 1,
      description: 'For HP and EP, modify every number of specified minutes. Ignored for all other modifiers.'
    },

    until: {
      type: 'ref',
      columnType: 'datetime',
      required: true,
      description: 'The campaign date/time this modifier expires.'
    }

  },

};

