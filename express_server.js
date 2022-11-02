const express = require("express");
const app = express();
const PORT = 8080;
app.use(express.urlencoded({ extended: true }));
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(cookieParser());
const morgan = require("morgan");

//generates a 6 digit random string for id
const generateRandomString = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let randomId = [];
  let splitArray = characters.split("");
  for (let i = 0; i <= 5; i++) {
    randomId.push(splitArray[Math.floor(Math.random() * characters.length)]);
  }
  return randomId.join("");
};

// global object to store and access users in app
const users = {
  // user1: {
  //   id: "user1",
  //   email: "user@e.com",
  //   password: "456",
  // },
  // user2: {
  //   id: "user2",
  //   email: "user2@e.com",
  //   password: "123",
  // },
};

//keeps track of all the urls and their shortened forms
const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// middleware
app.use(morgan("dev"));
//routes
// urls index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});
// submit form that shortens url
app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL; // newid-longURL key value pair save to urlDatabase
  // console.log(urlDatabase);
  res.redirect(`/urls/${newId}`); // need to redirect to /urls/:id
});
// new urls page
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});
//register page
app.get("/register", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    email: req.body["email"],
    password: req.body["password"],
  };
  res.render("urls_register", templateVars);
});
//registeration email and password

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  users[userId] = {
    userId,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

//url_show page (long and short versions)
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});
// delete new short url, redirect to urls_index
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});
// allow to edit long url in show page
// redirects to edit page
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  // console.log(urlDatabase[id])
  res.redirect("/urls/");
});
//redirect to longURl when click id, 404 if no longurl doesnt exist
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL) {
    res.status(404).send(`404 page not found`);
    return;
  }

  res.redirect(longURL);
});
//login route
app.post("/login", (req, res) => {
  res.cookie("username", req.body["username"]);
  res.redirect(`/urls`);
});
//logout route
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect(`/urls`);
});
// welcome page
app.get("/", (req, res) => {
  res.send("Hello!");
});

// reply that server is running and on which port
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});
