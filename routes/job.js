var express = require('express');
var router = express.Router();

var logger = require('morgan');

const {JobModel} = require('../db/models')

/* POST /job/add deals with adding a job post. */
router.post('/add', function(req, res) {
  const {userId, title, level, description} = req.body
  const now = Date.now()
  new JobModel({
    userId,
    title,
    level,
    description,
    create_time: now,
    update_time: now,
  }).save(function (err, job) {
    if (err) {
      logger(err.toString())
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({code: 0, data: {jobId: job._id}, msg: 'Add Job Success'})
  })
});

router.post('/update', function(req, res) {
  const {_id, title, level, description} = req.body
  JobModel.findByIdAndUpdate(
    _id,
  {
    title,
    level,
    description,
    update_time: Date.now(),
  }, function (err, _) {
      console.log(err)
      if (err) {
        logger(err)
        res.send({code: 1, msg: err.toString()})
        return;
      }
      res.send({code: 0, msg: `Update Job Success`})
    })
});

router.get('/get/:id', function(req, res) {
  const {id} = req.params
  JobModel.findById(id, function (err, job) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    if (job == null) {
      res.send({code: 1, msg: 'Not Found'})
      return;
    }
    res.send({code: 0, data: job, msg: `Get Job Success`})
  })
});

router.get('/get', function(req, res,next) {
  const data = []
  JobModel.find({}).populate('userId', 'company name').exec(function (err, jobs) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({code: 0, data: jobs, msg: `Get Job Success`})
  });
});

router.get('/getByUser/:userId', function(req, res) {
  const {userId} = req.params
  console.log(userId)
  JobModel.find({
    userId,
  }, function (err, jobs) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({
      code: 0,
      data: jobs,
      msg: `Get Job Success`
    })
  })
});

router.get('/delete/:id', function(req, res) {
  const {id} = req.params;
  console.log(id);
  JobModel.findByIdAndDelete(id,  function (err, _) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({code: 0, msg: `Delete Job Success`})
  })
});

module.exports = router;