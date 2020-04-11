module.exports = {


  friendlyName: 'sails.helpers.schedules.remove',


  description: 'Remove a schedule.',


  inputs: {
    record: {
      type: 'json',
      require: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    // Remove the schedule
    if (typeof ModelCache.scheduleCrons[inputs.record.id] !== undefined) {
      ModelCache.scheduleCrons[inputs.record.id].cancel();
      delete ModelCache.scheduleCrons[inputs.record.id];
    }
  }


};

