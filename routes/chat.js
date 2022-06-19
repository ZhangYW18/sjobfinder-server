var express = require('express');
var router = express.Router();

var logger = require('morgan');

const mongoose = require('mongoose')
const {ChatModel, UserModel} = require('../db/models')

const getChatId = (from, to) => {
  return from > to ? from + ',' + to : to + ',' + from;
}

/* GET /chat/user/:userId gets all conversations for a given user and the last message for each conversation. */
router.get('/user/:userId', function(req, res) {
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

/* GET /chat/partner/:partner_id/user/:user_id gets all messages in a conversation. */
router.get('/partner/:partner_id/user/:user_id', function(req, res) {
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
      ChatModel.where({chat_id}).sort({create_time: 1}).select('content create_time from')
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