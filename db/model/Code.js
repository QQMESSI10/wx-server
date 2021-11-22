const mongoose = require("mongoose");

const codeSchema = mongoose.Schema({
  phone: { type: String, required: true },
  code: { type: String, required: true },
  time: { type: String, required: true },
});

const Code = mongoose.model("code", codeSchema);
export default Code;