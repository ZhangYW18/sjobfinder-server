// Connect to database
const mongoose = require('mongoose')
mongoose.connect('mongodb://admin:Admin!23@localhost:27017/sjobfinder?authMechanism=DEFAULT&authSource=admin')
mongoose.connection.on('connected', () => {
  console.log('mongodb connect success!')
})

// Define user model.
const userSchema = mongoose.Schema({
  username: {type: String, required: true},
  password: {type: String, required: true},
  identity: {type: String, required: true}, // recruiter / job finder
  avatar: {type: String},
  post: {type: String},
  info: {type: String},
  company: {type: String},
  salary: {type: String}
})
const UserModel = mongoose.model('user', userSchema) // users collection
exports.UserModel = UserModel

// Define chat model.
const chatSchema = mongoose.Schema({
  from: {type: String, required: true},
  to: {type: String, required: true},
  chat_id: {type: String, required: true},
  content: {type: String, required: true},
  read: {type:Boolean, default: false},
  create_time: {type: Number}
})
const ChatModel = mongoose.model('chat', chatSchema) // chats collection
exports.ChatModel = ChatModel