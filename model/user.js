const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  token: { type: String },
  blogs: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog"
 }]
});

module.exports = mongoose.model("users", userSchema);
