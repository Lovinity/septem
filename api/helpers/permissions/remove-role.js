module.exports = {


  friendlyName: 'helpers.permissions.removeRole',


  description: 'remove a guild.settings role from a member.',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'The member to remove role from'
    },
    role: {
      type: 'string',
      required: true,
      description: 'The guildSettings key containing the role we want to remove.'
    },
    reason: {
      type: 'string',
      description: 'The reason for removing this role.'
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

    // If we reach here, remove the role.
    await inputs.member.roles.remove(inputs.member.guild.settings[ inputs.role ], inputs.reason);
    return true;
  }


};

