var express = require('express');
var router = express.Router();

var logger = require('morgan');

const {JobModel, UserModel} = require('../db/models')

/* POST /job/add deals with adding a job post. */
router.post('/add', function(req, res) {
  const {userId, title, level, description} = req.body
  const now = Date.now()
  const job = new JobModel({
    title,
    level,
    description,
    create_time: now,
    update_time: now,
  });
  // Judge whether the one who post the job exists first.
  UserModel.updateOne(
    // Must be a recruiter to post a job
    {_id: userId, identity: "recruiter"},
    { $push: { jobs: job } },
    function (err, _) {
      if (err) {
        logger(err.message)
        res.send({code: 1, msg: err.message})
        return;
      }
      res.send({code: 0, msg: `Add New Job Post Success`})
    }
  )
});

module.exports = router;