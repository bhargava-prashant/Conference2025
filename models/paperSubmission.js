const mongoose = require("mongoose");

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  affiliation: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: false },
});

const paperSubmissionSchema = new mongoose.Schema(
  {
    authors: [authorSchema], // Array of authors
    abstract: { type: String, required: true },
    paperPath: { type: String, required: true },
  },
  { timestamps: true }
);

// Avoid redefining model if already defined
const PaperSubmission = mongoose.models.PaperSubmission || mongoose.model('PaperSubmission', paperSubmissionSchema);

module.exports = PaperSubmission;
