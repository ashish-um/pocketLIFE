const express = require("express");
const authRouter = require("./routes/auth");
const proRouter = require("./routes/protected");
const yearRouter = require("./routes/year");
const dateRouter = require("./routes/date");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const checkAuth = require("./middleware/checkAuth");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./utils/cloudinary");
const multer = require("multer");
const DateModel = require("./models/dateModel");
const app = express();
const jwt = require("jsonwebtoken");
const yearModel = require("./models/yearModel");

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.urlencoded())
app.use(cors());

const uri = process.env.MONGODB_URI;
const PORT = process.env.PORT || 8080;

let mongoResponse = "";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connect to DB");
    mongoResponse = "Connected to DB";
  })
  .catch((err) => {
    console.log("faliled to connect to DB", err);
    mongoResponse = "Failed DB connection";
  });

app.post("/upload", checkAuth, upload.single("image"), async (req, res) => {
  const { title, content, mood } = req.body;
  const token = req.headers.authorization;
  const { _id } = jwt.decode(token);
  const date = new Date(req.body.date);

  let obj = await DateModel.findOne({ user: _id, date });
  if (!obj) {
    //create
    obj = await DateModel.create({
      user: _id,
      title,
      image: req.file.path,
      content,
      mood,
      date,
    });
  } else {
    (obj.title = title), (obj.image = req.file.path);
    obj.content = content;
    obj.mood = mood;
    await obj.save();
  }

  let yearEntry = await yearModel.findOne({
    user: _id,
    year: date.getFullYear(),
  });
  if (!yearEntry) {
    yearEntry = await yearModel.create({
      user: _id,
      year: date.getFullYear(),
      data: [{ date, mood }],
    });
  } else {
    let exists = false;
    yearEntry.data.forEach((item, index) => {
      if (
        new Date(item.date).getDate() == date.getDate() &&
        new Date(item.date).getMonth() == date.getMonth()
      ) {
        exists = true;
        yearEntry.data[index].mood = mood;
        console.log("Date Found!!!");
      }
    });
    if (!exists) {
      yearEntry.data = [...yearEntry.data, { date, mood }];
    }
    yearEntry.save();
  }
  return res.status(200).json(obj);
});

// Upload doodle image: store in Cloudinary and return URL, do not mutate DB records
app.post("/upload-doodle", checkAuth, upload.single("image"), async (req, res) => {
  try {
    // Using multer-storage-cloudinary, uploaded file is already at req.file.path (Cloudinary URL)
    return res.status(200).json({ image: req.file.path });
  } catch (e) {
    console.error("Failed to upload doodle", e);
    return res.status(500).json({ message: "Failed to upload doodle" });
  }
});

app.get("/", (req, res) => {
  res.send(`Server Running Fine... <br> <br>${mongoResponse}`);
});

app.use("/date", checkAuth, dateRouter);
app.use("/year", checkAuth, yearRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
