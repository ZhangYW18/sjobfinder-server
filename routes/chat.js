var express = require('express');
var router = express.Router();

var logger = require('morgan');

const mongoose = require('mongoose')
const {ChatModel, UserModel} = require('../db/models')

const getChatId = (from, to) => {
  return from > to ? from + ',' + to : to + ',' + from;
}

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
  let {userId} = req.params
  userId = new mongoose.Types.ObjectId(userId)
  ChatModel.aggregate([
    { $match: {
      $or: [
              {from: userId},
              {to: userId},
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
    { $project: {
        partner: {
          $cond: {
            if: { $eq: [ userId, "$to" ] },
            then: "$from",
            else: "$to"
          }
        },
        lastMessage: {
          content: "$content",
          date: "$date",
        },
        count_unread: {
          $cond: {
            if: { $eq: [ userId, "$to" ] },
            then: "$count_unread",
            else: 0
          }
        },
      },
    }
  ]).exec(function (err, chats) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    UserModel.populate(chats, {
        path: "partner",
        select: '_id name company avatar',
      },
      function (err, conversations) {
      if (err) {
        logger(err)
        res.send({code: 1, msg: err.toString()})
        return;
      }
      res.send({code: 0, data: conversations, msg: 'Get Chats Success'})
    });
  })
});

/* GET /chat/get/partner/:partner_id/user/:user_id  */
router.get('/get/partner/:partner_id/user/:user_id', function(req, res) {
  const {partner_id, user_id} = req.params
  const chat_id = getChatId(user_id, partner_id);
  // Mark messages as 'have been read' for the user who gets this conversation
  ChatModel.where({
    chat_id,
    to: user_id,
    read: false
  }).updateMany({read: true}).exec(function (err, writeOpResult) {
      if (err) {
        logger(err)
        res.send({code: 1, msg: err.toString()})
        return;
      }
      // Select messages in this conversation
      ChatModel.where({chat_id}).sort({create_time: -1}).select('content create_time from')
        .exec(function (err, msgs){
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