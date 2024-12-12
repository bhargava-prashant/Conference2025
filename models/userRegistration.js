const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },  // Add password field
    affiliation: { type: String, required: true },
    category: { type: String, required: true },  // Example: 'Student', 'Professional', etc.
    phone: { type: String, required: false },
    address: { type: String, required: false },
    paperId: { type: String, required: false },  // Optional reference to a submitted paper
  },
  { timestamps: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
