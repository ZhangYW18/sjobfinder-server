var express = require('express');
var router = express.Router();

var logger = require('morgan');

const mongoose = require('mongoose')
const {ChatModel} = require('../db/models')

/* POST /chat/add  */
router.post('/add', function(req, res) {
  const {from, to, content} = req.body
  const now = Date.now()
  new ChatModel({
    from,
    to,
    content,
    chat_id: from > to ? from + ',' + to : to + ',' + from,
    create_time: now,
    read: false,
  }).save(function (err, job) {
    if (err) {
      logger(err.toString())
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({code: 0, msg: 'Add Chat Message Success'})
  })
});

/* GET /chat/get/:userId  */
router.get('/get/:userId', function(req, res) {
  const {userId} = req.params
  ChatModel.aggregate([
    { $match: {
      $or: [
              {from: new mongoose.Types.ObjectId(userId)},
              {to: new mongoose.Types.ObjectId(userId)},
      ],
    }},
    { $sort: {"create_time": -1} },
    { $addFields : {
      unread : { $cond : [ "$read", 0, 1 ] }
    } },
    { $group: {
        "_id": "$chat_id",
        "from": {$first: "$from"},
        "to": {$first: "$to"},
        "content": {$first: '$content'},
        "date": {$first: '$create_time'},
        "count_unread": { $sum : '$unread'},
    }},
    { $sort: {"date": -1} },
  ]).exec(function (err, data) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({code: 0, data: data, msg: 'Get Chats Success'})
  })
});

/* GET /chat/get/messages/:chat_id  */
router.get('/get/messages/:chat_id', function(req, res) {
  const {chat_id} = req.params
  ChatModel.where({chat_id, read: false}).updateMany({read: true}).exec(function (err, writeOpResult) {
      if (err) {
        logger(err)
        res.send({code: 1, msg: err.toString()})
        return;
      }
      ChatModel.where({chat_id}).sort({create_time: -1}).exec(function (err, msgs){
        if (err) {
          logger(err)
          res.send({code: 1, msg: err.toString()})
          return;
        }
        res.send({code: 0, data: msgs, msg: 'Get Chats Success'})
      });
    })
});

module.exports = router;