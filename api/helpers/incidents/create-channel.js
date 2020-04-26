module.exports = {


  friendlyName: 'incidents.createChannel',


  description: 'Create a Discord incidents channel and return it.',


  inputs: {
    type: {
      type: 'string',
      required: true,
      isIn: [ 'support', 'interrogation', 'discipline', 'inactive', 'inquiry' ],
      description: 'The type of the incident channel.'
    },
    guild: {
      type: 'ref',
      required: true,
      description: 'The guild to initiate the channel.'
    },
    members: {
      type: 'ref',
      required: true,
      description: 'Array of members involved in automatic functionality for this channel (support/inquiry = initiator, interrogation/discipline/inactive = involved members)'
    },
  },


  fn: async function (inputs) {
    // Cannot create one of the incidents category is not set!
    if (!inputs.guild.settings.incidentsCategory) {
      await sails.helpers.events.warn(`Discord: cannot create ${type} incident channel for guild ${guild.name} because no incidentsCategory was set.`)
      return;
    }

    var memberString = [];
    var overwrites = [];

    // Grant staff permissions on inquiry
    if ([ 'inquiry' ].includes(inputs.type) && inputs.guild.settings.staffRole) {
      overwrites.push({
        id: inputs.guild.settings.staffRole,
        allow: [
          "ADD_REACTIONS",
          "VIEW_CHANNEL",
          "SEND_MESSAGES",
          "MENTION_EVERYONE",
          "EMBED_LINKS",
          "ATTACH_FILES",
          "READ_MESSAGE_HISTORY"
        ],
        type: 'role'
      });
    }

    // Grant mod permissions on everything
    if (inputs.guild.settings.modRole) {
      overwrites.push({
        id: inputs.guild.settings.modRole,
        allow: [
          "ADD_REACTIONS",
          "VIEW_CHANNEL",
          "SEND_MESSAGES",
          "MANAGE_MESSAGES",
          "MENTION_EVERYONE",
          "MANAGE_ROLES",
          "EMBED_LINKS",
          "ATTACH_FILES",
          "READ_MESSAGE_HISTORY"
        ],
        type: 'role'
      });
    }

    // Add permissions for each provided member, and add them to the channel topic for automation
    if (inputs.members && inputs.members.forEach) {
      inputs.members.forEach((member) => {
        memberString.push(member.id);
        overwrites.push({
          id: member.id,
          allow: [
            "ADD_REACTIONS",
            "VIEW_CHANNEL",
            "SEND_MESSAGES",
            "EMBED_LINKS",
            "ATTACH_FILES",
            "READ_MESSAGE_HISTORY"
          ],
          type: 'member'
        });
      })
    }

    // Create the channel
    return await inputs.guild.channels.create(`${inputs.type}-${await sails.helpers.uid()}`, {
      type: 'text',
      topic: `${inputs.type} channel. Members: ${memberString.join(" ")} `,
      parent: inputs.guild.settings.incidentsCategory,
      permissionOverwrites: overwrites,
      rateLimitPerUser: 15,
    });

  }


};

