import mongoose from "mongoose";

const phoneSchema = mongoose.Schema({
  phone: { type: String, required: true },
});

const Phone = mongoose.model("phone", phoneSchema);
export default Phone;