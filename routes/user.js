var express = require('express');
var router = express.Router();
var logger = require('morgan');
var md5 = require('blueimp-md5')

const {UserModel} = require('../db/models')

/* POST /user/register deals with register actions.
* If the user already registered, return error.
* If not, save user info in database. */
router.post('/register', function(req, res) {
  const {username, password, identity} = req.body
  const query = UserModel.where({ username: username });
  query.select('username');
  query.findOne(function (err, user) {
    if (err) {
      logger(err.message)
      res.send({code: 1, msg: err.message})
      return;
    }
    if (user) {
      res.send({code: 1, msg: `User ${user.username} already exists`})
    } else {
      new UserModel({
        username,
        password: md5(password),
        identity,
      }).save(function (err, user) {
        // Cookie is valid for 7 days
        // res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7})
        res.cookie('userid', user._id, {maxAge: 1000})
        const data = {_id: user._id, username, identity}
        res.send({code: 0, data: data, msg: 'Register Success!'})
      })
    }
  })
});

/* POST /user/login deals with user login requests. */
router.post('/login', function(req, res) {
  const {username, password} = req.body
  const query = UserModel.where({ username: username });
  query.findOne( function (err, user) {
    if (err) {
      logger(err.message)
      res.send({
        code: 1,
        msg: err.message,
      })
      return;
    }
    if (user) {
      if (user.password === md5(password)) {
        // res.cookie('userid', user._id, {maxAge: 1000*60*60*24*7})
        res.cookie('userid', user._id, {maxAge: 1000})
        res.send({
          code: 0,
          data: {
            username: user.username,
            identity: user.identity,
          },
          msg: 'Login success!',
        })
      } else {
        res.send({
          code: 1,
          msg: 'Incorrect Password',
        })
      }
    } else {
      res.send({
        code: 1,
        msg: `Invalid Username`,
      })
    }
  })
});

module.exports = router;
