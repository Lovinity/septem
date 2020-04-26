module.exports = {


  friendlyName: 'helpers.permissions.addRole',


  description: 'Add a guild.settings role to a member.',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'The member to add role to'
    },
    role: {
      type: 'string',
      required: true,
      description: 'The guildSettings key containing the role we want to add.'
    },
    reason: {
      type: 'string',
      description: 'The reason for adding this role.'
    }
  },


  fn: async function (inputs) {
    // Setting not set? Exit.
    if (!inputs.member.guild.settings[ inputs.role ])
      return false;

    // Setting set, but role does not exist? Return false.
    if (!inputs.member.guild.roles.cache.has(inputs.member.guild.settings[ inputs.role ]))
      return false;

    // If the member has the role, return false.
    if (inputs.member.roles.cache.has(inputs.member.guild.settings[ inputs.role ]))
      return true;

    // If we reach here, add the role.
    await inputs.member.roles.add(inputs.member.guild.settings[ inputs.role ], inputs.reason);
    return true;
  }


};

