// Connect to database
const mongoose = require('mongoose')
mongoose.connect('mongodb://admin:Admin!23@localhost:27017/sjobfinder?authMechanism=DEFAULT&authSource=admin')
mongoose.connection.on('connected', () => {
  console.log('mongodb connect success!')
})

// Define user model.
const userSchema = mongoose.Schema({
  // common fields
  username: {type: String, required: true},
  password: {type: String, required: true},
  identity: {type: String, required: true}, // 'recruiter' / 'hunter'
  avatar: {type: Number},                   // Chosen from avatar 0-19
  name: {type: String},
  // hunter-only fields
  introduction: {type: String},
  headline: {type: String},               // short headline of user
  // recruiter-only fields
  company: {type: String},
})
const UserModel = mongoose.model('user', userSchema) // users collection
exports.UserModel = UserModel

// Define job model.
const jobSchema = mongoose.Schema({
  recruiter: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},   // posted by
  title: {type: String, required: true},
  // industry: {type: String, required: true},
  description: {type: String},
  level: {type: Number},                    // 1: entry level, 2: mid level, 3: senior level
  create_time: {type: Date},
  update_time: {type: Date},
})
const jobModel = mongoose.model('job', jobSchema) // jobs
exports.JobModel = jobModel

// Define msg model.
const chatSchema = mongoose.Schema({
  from: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
  to: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
  chat_id: {type: String, required: true},
  content: {type: String, required: true},
  read: {type: Boolean, default: false},
  create_time: {type: Date},
})
const chatModel = mongoose.model('chat', chatSchema) // chats collection
exports.ChatModel = chatModel