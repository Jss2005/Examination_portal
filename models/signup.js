require("dotenv").config(); // Load environment variables
const mongoose = require("mongoose");
const crypto = require("crypto");
const Schema = mongoose.Schema;


const signupSchema = new Schema({
    username: { type: String, required: true },
    rollNumber: { type: String, required: true },
    password: { type: String, required: true }, // Encrypted password
    image: { type: String, required: true },
});


module.exports = mongoose.model("SignUp", signupSchema);