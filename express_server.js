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
// returns user
const getUser = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return false;
};
// global object to store and access users in app
const users = {};
const emailAlreadyExists = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
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
  console.log("users:", users);
  console.log("request", req.cookies["user_Id"]);
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_Id"]],
  };
  res.render("urls_index", templateVars);
});
// new urls page
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_Id"]] };
  res.render("urls_new", templateVars);
});
//register page
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_Id"]],
    // email: req.body["email"],
    // password: req.body["password"],
  };
  res.render("urls_register", templateVars);
});
// login page
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_Id"]] };
  res.render("urls_login", templateVars);
});
//url_show page (long and short versions)
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_Id"]],
  };
  res.render("urls_show", templateVars);
});
// submit form that shortens url
app.post("/urls", (req, res) => {
  let newId = generateRandomString();
  urlDatabase[newId] = req.body.longURL; // newid-longURL key value pair save to urlDatabase
  // console.log(urlDatabase);
  res.redirect(`/urls/${newId}`); // need to redirect to /urls/:id
});
// delete new short url, redirect to urls_index
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});
//registeration email and password
app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if ((!emailAlreadyExists(req.body.email), users)) {
      const userId = generateRandomString();
      users[userId] = {
        userId,
        email: req.body.email,
        password: req.body.password,
      };
      res.cookie("user_Id", userId);
      res.redirect("/urls");
      return;
    } else {
      res.status(400).send(`Sorry, that email already exists`);
      return;
    }
  }
  res.status(400).send(`Please enter an email and password`);
});
// allow to edit long url in show page
// redirects to edit page
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect("/urls");
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
  const user = getUser(req.body.email, users);
  if (user) {
    console.log("user:", user);
    if (req.body.password === user.password) {
      res.cookie("user_Id", user.userId);
      res.redirect("/urls/");
    } else {
      res.statusCode = 403;
      res.send(`Please try again, password and email do not match`);
    }
  } else {
    res.statusCode = 403;
    res.send(`Sorry, email not found`);
  }
});
//logout route
app.post("/logout", (req, res) => {
  res.clearCookie("user_Id");
  res.redirect(`/login`);
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
