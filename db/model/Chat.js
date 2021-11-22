const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
  phone: { type: String, required: true },
  content: { type: String, required: true },
  time: { type: String, required: true },
});

const Chat = mongoose.model("chat", chatSchema);
export default Chat;