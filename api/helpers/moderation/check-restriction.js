module.exports = {


  friendlyName: 'moderation.checkRestriction',


  description: 'Check if a restriction exists from the mod logs.',


  inputs: {
    moderation: {
      type: 'ref',
      required: true,
      description: 'The moderation logs to check'
    },
    restriction: {
      type: 'string',
      required: true,
      description: 'The restriction to check'
    }
  },


  fn: async function (inputs) {
    var record = inputs.moderation.find((log) => !log.appealed && log[ inputs.restriction ]);
    if (record) {
      return true;
    }
    return false;
  }


};

