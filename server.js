const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const multer = require("multer");
const PaperSubmission = require("./models/paperSubmission");
const UserRegistration = require("./models/userRegistration");

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURI = "mongodb+srv://prashantbhargava365:Nv5BW1StsoAy1RmX@cluster0.i6x2q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define file schema
const FileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: String, // Store Base64 data
});
const File = mongoose.model("File", FileSchema);

// Multer setup
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Root route to serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Paper submission route
app.post("/submit-paper", upload.single("paper"), async (req, res) => {
  try {
    const { authors, abstract } = req.body;

    if (!authors || !abstract || !req.file) {
      return res.status(400).json({
        success: false,
        message: "All fields (authors, abstract, paper) are required.",
      });
    }

    // Parse authors from JSON string if needed
    const authorsData = JSON.parse(authors);

    // Create a new file document
    const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer.toString("base64"), // Convert to Base64
    });

    const savedFile = await newFile.save();

    // Create new paper submission object
    const newSubmission = new PaperSubmission({
      authors: authorsData,
      abstract,
      paperPath: savedFile._id, // Reference the file ID
    });

    // Save the submission to MongoDB
    await newSubmission.save();
    res.status(200).json({
      success: true,
      message: "Paper submitted successfully!",
    });
  } catch (error) {
    console.error("Error submitting paper:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting paper. Please try again.",
    });
  }
});

// Fetch paper route
app.get("/paper/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const fileBuffer = Buffer.from(file.data, "base64"); // Convert Base64 back to Buffer
    res.setHeader("Content-Type", file.contentType);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error fetching paper:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching paper. Please try again.",
    });
  }
});

// User registration route
app.post("/register", async (req, res) => {
  const { fullName, email, password, address, affiliation, category, paperId, phone } = req.body;

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long and contain at least one letter and one number.",
    });
  }

  try {
    const existingUser = await UserRegistration.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserRegistration({
      fullName,
      email,
      password: hashedPassword,
      address,
      affiliation,
      category,
      paperId,
      phone,
    });

    await newUser.save();
    res.status(200).json({
      success: true,
      message: "Registration successful!",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user. Please try again.",
    });
  }
});

// Catch-all for unhandled routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
