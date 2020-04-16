module.exports = {


  friendlyName: 'event.messageReactionRemoveAll',


  description: 'Discord message reaction remove all event',


  inputs: {
    message: {
      type: 'ref',
      required: true,
      description: "The message where all reactions were removed."
    }
  },


  fn: async function (inputs) {
    // Upgrade partial messages to full messages
    if (inputs.message.partial) {
      await inputs.message.fetch();
    }

    if (!inputs.message.member)
      return null;

    // Remove all reputation
    await sails.helpers.reputation.removeAll(inputs.message);

    // Remove starboard
    await sails.helpers.starboard.remove(inputs.message);
  }
};

