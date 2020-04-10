module.exports = {


  friendlyName: 'schedules.add',


  description: 'Schedule a cron job to cache.',


  inputs: {
    record: {
      type: 'json',
      require: true,
      description: 'The schedules database record'
    }
  },


  fn: async function (inputs) {
    var schedule = require('node-schedule');

    // Skip tasks that do not exist
    if (typeof sails.helpers.tasks === 'undefined' || typeof sails.helpers.tasks[ inputs.record.task ] === 'undefined') return;

    // Unschedule existing schedule if applicable
    if (typeof ModelCache.scheduleCrons[inputs.record.ID] !== undefined) {
      ModelCache.scheduleCrons[inputs.record.ID].cancel();
    }

    // Tasks that have a one-time run
    if (inputs.record.nextRun && !inputs.record.cron) {
      ModelCache.scheduleCrons[inputs.record.ID] = schedule.scheduleJob(moment(inputs.record.nextRun).toDate(), async () => await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {}));

      // Tasks that have a cron recurrence
    } else if (inputs.record.cron) {
      var options = { rule: inputs.record.cron };
      if (inputs.record.catchUp) {
        options.start = moment(inputs.record.nextRun || inputs.record.lastRun).toDate();
      }
      ModelCache.scheduleCrons[inputs.record.ID] = schedule.scheduleJob(options, async () => await sails.helpers.tasks[ inputs.record.task ].with(inputs.record.data || {}));
    }
  }


};

