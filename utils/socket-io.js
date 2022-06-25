const {ChatModel, UserModel} = require("../db/models");

var logger = require('morgan');

module.exports = function (server) {
  const {Server} = require("socket.io")
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
    // Received new chat message from clients
    socket.on('sendMsg', (args) => {
      const {from, to, msg} = args;
      console.log('sendMsg args', args);
      // Save message in database.
      new ChatModel({
        from,
        to,
        content: msg,
        chat_id: from > to ? from + ',' + to : to + ',' + from,
        create_time: Date.now(),
        read: false,
      }).save(function (err, savedMsg) {
        if (err) {
          logger(err.toString())
          io.emit('receiveMsg',{code: 1, data: {msg: msg}, msg: err.toString()})
          return;
        }
        UserModel.populate(savedMsg, {
            path: "from to",
            select: '_id name company avatar',
        }, function (err, populatedMsg) {
          if (err) {
            logger(err.toString())
            io.emit('receiveMsg',{code: 1, data: {msg: msg}, msg: err.toString()})
            return;
          }
          io.emit('receiveMsg', {code: 0, data: populatedMsg, msg: 'Add Chat Message Success'});
        })
      })
    });
  });
}
