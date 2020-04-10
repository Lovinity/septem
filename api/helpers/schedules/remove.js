module.exports = {


  friendlyName: 'schedules.remove',


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
    if (typeof ModelCache.scheduleCrons[inputs.record.ID] !== undefined) {
      ModelCache.scheduleCrons[inputs.record.ID].cancel();
      delete ModelCache.scheduleCrons[inputs.record.ID];
    }
  }


};

