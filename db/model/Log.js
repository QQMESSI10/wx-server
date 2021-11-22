const mongoose = require("mongoose");

const logSchema = mongoose.Schema({
  params: { type: String, required: true },
  msg: { type: String, required: true },
  time: { type: String, required: true },
});

const Log = mongoose.model("log", logSchema);
export default Log;