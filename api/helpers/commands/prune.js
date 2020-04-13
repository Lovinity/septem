module.exports = {


  friendlyName: 'commands.prune',


  description: 'Prune Discord messages in a channel.',


  inputs: {
    message: {
      type: 'ref',
      required: true
    },
    limit: {
      type: 'number',
      min: 1,
      max: 1000,
      defaultsTo: 100,
      description: 'Maximum number of messages to delete.'
    },
    filter: {
      type: 'string',
      isIn: [ 'link', 'invite', 'bots', 'you', 'me', 'upload', 'user', 'noupload' ],
      description: 'Choose a filter to decide which messages to prune. If no filter provided, all messages are subject to removal.'
    }
  },


  fn: async function (inputs) {
    if (!await sails.helpers.permissions.checkRole(inputs.message.member, 'modRole')) {
      return inputs.message.send(`:x: Sorry, but only members with modRole can use the prune command.`);
    }

    var message = await inputs.message.send(`:hourglass_flowing_sand: Initializing prune...`);
    await process(inputs.message, inputs.limit, inputs.filter);
    return inputs.message.send(`:white_check_mark: Prune operation executed. It could take a moment to finish.`);
  }


};

function getFilter (message, filter, user) {
  switch (filter) {
    // Here we use Regex to check for the diffrent types of prune options
    case 'link':
      return mes => /https?:\/\/[^ /.]+\.[^ /.]+/.test(mes.content);
    case 'invite':
      return mes => /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(mes.content);
    case 'bots':
      return mes => mes.author.bot;
    case 'you':
      return mes => mes.author.id === DiscordClient.user.id;
    case 'me':
      return mes => mes.author.id === message.author.id;
    case 'upload':
      return mes => mes.attachments.size > 0;
    case 'user':
      return mes => mes.author.id === user.id;
    case 'noupload':
      return mes => mes.attachments.size === 0;
    default:
      return () => true;
  }
}

function process (message, limit, filter) {
  return new Promise((resolve, reject) => {
    var iteration = 0;
    var before = message.id;
    var fn = () => {
      _process(message, limit, filter, before).then((filtered) => {
        if (filtered[ 0 ] <= 0)
          limit = -1;
        before = filtered[ 1 ];
        limit -= filtered[ 0 ];
        iteration++;

        if (limit > 0 && iteration < 10) {
          setTimeout(() => {
            fn();
          }, 1000);
        } else {
          return resolve();
        }
      })
    }
    fn();
  })
}

async function _process (message, amount, filter, before) {
  let messages = await message.channel.messages.fetch({ limit: 100, before: before });
  if (messages.array().length <= 0)
    return [ -1 ];
  before = messages.lastKey();
  if (filter) {
    const user = typeof filter !== 'string' ? filter : null;
    const type = typeof filter === 'string' ? filter : 'user';
    messages = messages.filter(getFilter(message, type, user));
  }
  messages = messages.array().slice(0, amount);
  messages.map((msg) => {
    msg.delete();
  });
  return [ messages.length, before ];
}