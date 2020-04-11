/**
 * Characters.js
 *
 * @description :: A collection of role play characters.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    userID: {
      type: 'string',
      required: true
    },

    guildID: {
      type: 'string',
      required: true
    },

    name: {
      type: 'string',
      maxLength: 64,
      description: 'Name of the character',
      required: true
    },

    type: {
      type: 'string',
      isIn: ['Earth', 'LM', 'Earth NPC', 'LM NPC'],
      required: true,
      description: 'Type of character'
    },

    class: {
      type: 'string',
      maxLength: 64,
      allowNull: true,
      description: 'Descriptor of the character class, if applicable.'
    },

    bio: {
      type: 'string',
      maxLength: 2048,
      allowNull: true,
      description: 'Character biography'
    },

    skills: {
      type: 'json',
      description: 'Array of character skills. Should contain dice modifiers where applicable.'
    },

    weaknesses: {
      type: 'json',
      description: 'Array of character weaknesses. Should contain dice modifiers where applicable.'
    },

    powerups: {
      type: 'json',
      description: 'Array of active powerups this character has. Include dice modifiers where applicable and duration of powerup.'
    },

    ailments: {
      type: 'json',
      description: 'Array of active ailments this character has. Include dice modifiers where applicable and duration of ailment.'
    },

    strength: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on anything requiring physical strength, such as pushing, pulling, punching / physical combat, carrying, etc.'
    },

    dexterity: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on a characters ability to dodge an attack, or the distance they can move on a map in a turn.'
    },

    constitution: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on a characters ability to avert bad ailments / spells and apply powerups. Also determines max HP.'
    },

    intelligence: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on a characters ability to acquire information or clues.'
    },

    wisdom: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on a character’s ability to decipher what is going on around them (such as if they detect danger) or to avoid doing something stupid.'
    },

    charisma: {
      type: 'number',
      min: 1,
      max: 30,
      defaultsTo: 1,
      description: 'Determines + modifier on a character’s ability to convince other characters to do something or to be-friend them.'
    },

    XP: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Experience points, which determines the level of the character.'
    },

    HP: {
      type: 'number',
      min: 0,
      defaultsTo: 0,
      description: 'Hit points / health of the character.'
    },

    EP: {
      type: 'number',
      min: 0,
      defaultsTo: 25,
      description: 'Energy points. Determines how much energy the character has to run or use energy-based spells/attacks.'
    }

  },

  // Websockets and cache standards
  afterCreate: function (newlyCreatedRecord, proceed) {
    var data = { insert: newlyCreatedRecord }
    sails.sockets.broadcast('characters', 'characters', data);
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].members = {};
    }
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ] = {};
    }
    if (typeof ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ].characters === 'undefined') {
      ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ].characters = {};
    }
    ModelCache.guilds[ newlyCreatedRecord.guildID ].members[ newlyCreatedRecord.userID ].characters[ newlyCreatedRecord.ID ] = newlyCreatedRecord;

    return proceed()
  },

  afterUpdate: function (updatedRecord, proceed) {
    var data = { update: updatedRecord }
    sails.sockets.broadcast('characters', 'characters', data);
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].members = {};
    }
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ] = {};
    }
    if (typeof ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ].characters === 'undefined') {
      ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ].characters = {};
    }
    ModelCache.guilds[ updatedRecord.guildID ].members[ updatedRecord.userID ].characters[ updatedRecord.ID ] = updatedRecord;

    return proceed()
  },

  afterDestroy: function (destroyedRecord, proceed) {
    var data = { remove: destroyedRecord.id }
    sails.sockets.broadcast('characters', 'characters', data);
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].members === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].members = {};
    }
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ] === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ] = {};
    }
    if (typeof ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ].characters === 'undefined') {
      ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ].characters = {};
    }
    delete ModelCache.guilds[ destroyedRecord.guildID ].members[ destroyedRecord.userID ].characters[ destroyedRecord.ID ];

    return proceed()
  }

};

