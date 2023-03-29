const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const Routes = express.Router();
const fs = require("fs");
const app = express();

app.set("view engine", "ejs");

mongoose.set("strictQuery", false);

//
app.use(bodyParser.urlencoded({ extends: false }));
app.use(express.json());
// connect database
mongoose.connect("mongodb://127.0.0.1:27017/express-crud", {
  useNewUrlParser: true,
});


// importation message de session
app.use(
  session({ secret: "My_Secret_Key", resave: false, saveUninitialized: true })
);

app.use((req, res, next) => {
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});


const User = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  image: String,
});


const Users = mongoose.model("users", User);


//method get 
app.get("/", async (req, res) => {
  try {
    const users = await Users.find();
    res.render("index", { Users: users });
  } catch (error) {
    console.log(error);
  }
});


//method create and store
app.get("/create", (req, res) => {
  res.render("create");
});
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
var upload = multer({
  storage: storage,
}).single("image");
app.use(express.static("uploads"));
app.post("/add", upload, (req, res) => {
  const { name, email, phone } = req.body;
  const user = new Users({
    name,
    email,
    phone,
    image: req.file.filename,
  });
  user.save().then(() => {
    req.session.message = {
      type: "success",
      message: "utilisateur ajouté avec succès",
    };
    res.redirect("/");
  });
});
//edit and update
app.get("/edit/:id", async (req, res) => {
  let id = req.params.id;
  const User = await Users.findById(id);
  res.render("edit", { user: User });
});
app.post("/update/:id", upload, async (req, res) => {
  let id = req.params.id;
  let new_image = "";
  if (req.file) {
    new_image = req.file.filename;
    fs.unlinkSync("./uploads/" + req.body.old_img);
  } else {
    new_image = req.body.old_img;
  }
  try {
    await Users.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });
  } catch (error) {
    console.log(error);
  }
  req.session.message = {
    type: "success",
    message: "utilisateur modifié avec succès",
  };
  res.redirect("/");
});
//method delete
app.get("/delete/:id", async (req, res) => {
  let id = req.params.id;
  try {
    await Users.findByIdAndDelete(id, (result) => {
      if (result.image != "") {
        fs.unlinkSync("./uploads/" + result.image);
      }
    });
    req.session.message = {
      type: "danger",
      message: "utilisateur supprimé avec succès",
    };
  } catch (error) {
    res.json({ message: error.message });
  }

  res.redirect("/");
});

app.listen(3000, () => {
  console.log("listening on http:/localhost:3000");
});
