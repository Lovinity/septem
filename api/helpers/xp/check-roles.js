module.exports = {


  friendlyName: 'XP.checkRoles',


  description: 'Check a guild member XP roles and update them as necessary for the XP they have. Returns an array pair of role IDs added and role IDs removed.',


  inputs: {
    member: {
      type: 'ref',
      required: true,
      description: 'The member to check and update XP roles for.'
    }
  },


  fn: async function (inputs) {
    var levelRoles = {};
    var levelRoles2 = inputs.member.guild.settings.levelRoles;
    for (var key in levelRoles2) {
      if (levelRoles2.hasOwnProperty(key)) {
        if (levelRoles2[ key ] === null)
          continue;
        levelRoles[ key.replace('level', '') ] = levelRoles2[ key ];
      }
    }
    var levelKeys = Object.keys(levelRoles);
    if (levelKeys.length > 0) {
      var rolesToAdd = [];
      var rolesToRemove = [];
      levelKeys.map(levelKey => {
        var XP = Math.ceil(((levelKey - 1) / 0.177) ** 2) * 5;
        if (inputs.member.guild.roles.cache.has(levelRoles[ levelKey ])) {
          if (inputs.member.settings.XP >= XP && !inputs.member.roles.cache.has(levelRoles[ levelKey ])) {
            rolesToAdd.push(levelRoles[ levelKey ]);
          } else if (inputs.member.settings.XP < XP && inputs.member.roles.cache.has(levelRoles[ levelKey ])) {
            rolesToRemove.push(levelRoles[ levelKey ]);
          }
        }
      });

      if (rolesToAdd.length > 0)
        await inputs.member.roles.add(rolesToAdd, `Level Update (add roles)`)

      if (rolesToRemove.length > 0)
        await inputs.member.roles.remove(rolesToRemove, `Level Update (remove roles)`);
    }

    return [ rolesToAdd, rolesToRemove ];
  }


};

