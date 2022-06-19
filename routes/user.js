var express = require('express');
var router = express.Router();

var logger = require('morgan');
var md5 = require('blueimp-md5')

const {UserModel, JobModel} = require('../db/models')

/* POST /user/register deals with register actions.
* If the user already registered, return error.
* If not, save user info in database. */
router.post('/register', function(req, res) {
  const {username, password, identity} = req.body
  const query = UserModel.where({ username: username });
  query.select('_id');
  query.findOne(function (err, user) {
    if (err) {
      logger(err)
      res.send({code: 1, msg: err.toString()})
      return;
    }
    if (user) {
      res.send({code: 1, msg: `Username already exists`})
    } else {
      new UserModel({
        username,
        password: md5(password),
        identity,
      }).save(function (err, user) {
        // Cookie is valid for 7 days
        res.cookie('userid', user._id.toString(), {maxAge: 1000*60*60*24*7})
        //res.cookie('userid', user._id, {maxAge: 1000})
        res.send({
          code: 0,
          data: {
            user: {
              _id: user._id,
              username,
              identity,
            },
          },
          msg: 'Register Success!',
        })
      })
    }
  })
});

/* POST /user/login deals with user login requests. */
router.post('/login', function(req, res) {
  const {username, password} = req.body
  UserModel.where({ username: username }).findOne( function (err, user) {
    if (err) {
      logger(err)
      res.send({
        code: 1,
        msg: err.toString(),
      })
      return;
    }
    if (user) {
      if (user.password === md5(password)) {
        if (user.identity === 'recruiter') {
          // Find the jobs posted by this user
          // Only provide basic job infos like title and level
          JobModel.where({recruiter: user._id}).select('_id title level').exec( function (err, jobs) {
            if (err) {
              logger(err);
              res.send({code: 1, msg: err.toString()});
              return;
            }
            // Put user's id in cookie (valid for 7 days).
            res.cookie('userid', user._id.toString(), {maxAge: 1000*60*60*24*7});
            //res.cookie('userid', user._id, {maxAge: 1000});
            user.password = '';
            res.send({
              code: 0,
              data: {
                user: user,
                jobs: jobs,
              },
              msg: 'Login Success',
            })
          })
        } else {
          res.cookie('userid', user._id.toString(), {maxAge: 1000*60*60*24*7});
          // res.cookie('userid', user._id, {maxAge: 1000});
          user.password = '';
          res.send({
            code: 0,
            data: {
              user: user
            },
            msg: 'Login Success',
          })
        }
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

/* POST /user/profile deals with updating a user's profile. */
router.post('/profile', function(req, res) {
  const {_id, name, avatar, introduction, headline, company} = req.body

  // Judge if "avatar" parameter is out of range
  if (avatar !== undefined && (Number(avatar) < 0 || Number(avatar) >= 20)) {
    res.send({code: 1, msg: `Parameter "avatar" is out of range`})
    return
  }

  UserModel.findByIdAndUpdate(_id,
    {
      name, avatar, introduction, headline, company
    },
    {
      new: true,
    },
    function (err, user) {
      if (err) {
        logger(err.toString())
        res.send({code: 1, msg: err.toString()})
        return;
      }
      user.password = '';
      res.send({code: 0, data: {user: user}, msg: `Update Profile Success`})
    }
  )
});

/* GET /user/:identity returns the list of users given the identity of user. */
router.get('/identity/:identity', function(req, res) {
  const {identity} = req.params
  UserModel.where({
    identity,
  }).select('-password -identity').exec( function (err, users) {
    if (err) {
      logger(err.toString())
      res.send({code: 1, msg: err.toString()})
      return;
    }
    res.send({
      code: 0,
      data: users,
      msg: `Get User Success`
    })
  })
});

module.exports = router;
