const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  phone: { type: String, required: true },
  name: { type: String, required: true },
  psw: { type: String, required: true },
  time: { type: String },
  img: { type: String },
  bgColor: { type: String },
  isStop: { type: Boolean, default: false }
});

const User = mongoose.model("user", userSchema);
export default User;