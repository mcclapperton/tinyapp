const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const { urlsForUser, getUser, generateRandomString } = require("./helpers");

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["gyfisdbiri", "iwirufhfhfhfhf0987hfhf"],
  })
);

// global object to store and access users in app
const users = {
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};
const urlDatabase = {};

//ROUTES

// login page
//redirects to /urls if logged in
app.get("/login", (req, res) => {
  if (req.session.userId) {
    return res.redirect(`/urls`);
  }
  let templateVars = { user: null };
  res.render("urls_login", templateVars);
});

// Post to urls
// submit form that shortens url, if not logged in says please login
app.post("/urls", (req, res) => {
  const cookieID = req.session.userId;
  const updatedURL = req.body.longURL;
  if (cookieID) {
    if (!updatedURL) {
      return res.status(400).send("<h2>Make sure to enter a valid url</h2>");
    }
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: updatedURL,
      userID: cookieID,
    };
    return res.redirect(`/urls/${id}`);
  }
  return res.status(403).send("<h2>Please login to shorten your url</h2>");
});
//registration email and password
app.post("/register", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  if (email && password) {
    if (!getUser(null, email, users)) {
      const id = generateRandomString();
      users[id] = {
        id: id,
        email,
        password: bcrypt.hashSync(password),
      };
      req.session.userId = id;
      return res.redirect("/urls");
    }
    return res.status(400).send("<h2>Sorry, that email already exists</h2>");
  }
  res.status(400).send("<h2>Please enter an email and password</h2>");
});
//register page, if logged in redirect to /urls
app.get("/register", (req, res) => {
  const cookieID = req.session.userId;
  const id = req.params.id;
  if (cookieID) {
    return res.redirect(`/urls`);
  }
  const templateVars = { id, user: null };
  res.render("urls_register", templateVars);
});

//redirect to longURl when click id, 404 if no longurl
//  doesnt exist, if id doesnt exist send message
app.get("/u/:id", (req, res) => {
  const cookieID = req.session.userId;
  if (!cookieID) {
    return res.send("<h2>Login to see page!</h2>");
  }
  if (!urlDatabase[req.params.id]) {
    return res
      .status(404)
      .send("<h2>404 page not found, this URL does not exist</h2>");
  }

  return res.redirect(urlDatabase[req.params.id].longURL);
});

//deletes url from myURLS
app.post("/urls/:id/delete", (req, res) => {
  const cookieID = req.session.userId;
  const id = req.params.id;

  if (!id) {
    return res.send("<h2>Id does not exist</h2>");
  }
  if (!cookieID) {
    return res.send("<h2>Login to view</h2>");
  }
  if (cookieID !== urlDatabase[id].userID) {
    return res.send("<h2>Unable to edit URLS that dont belong to you</h2>");
  }

  delete urlDatabase[req.params.id];

  res.redirect("/urls");
});

//login route
app.post("/login", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const user = getUser(null, email, users);
  if (user === null) {
    return res.status(403).send("<h2>Sorry, user not found</h2>");
  }
  if (bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    return res.redirect("/urls");
  }
  return res
    .status(403)
    .send("<h2>Please try again, password and email do not match</h2>");
});

//logout route
app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect(`/login`);
});
// allow to edit long url in show page
// redirects to edit page
app.post("/urls/:id", (req, res) => {
  const cookieID = req.session.userId;
  const id = req.params.id;
  const updatedURL = req.body.longURL;
  if (!id) {
    return res.send("<h2>Id does not exist</h2>");
  }
  if (!cookieID) {
    return res.send("<h2>Login to view</h2>");
  }
  if (cookieID !== urlDatabase[id].userID) {
    return res.send("<h2>Unable to edit URLS that dont belong to you</h2>");
  }
  urlDatabase[id] = {
    longURL: updatedURL,
    userID: cookieID,
  };
  return res.redirect(`/urls`);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// render form page to generate new shortURL id and longURL pair;
//  redirect to login if not logged in
app.get("/urls/new", (req, res) => {
  const cookieID = req.session.userId;
  const user = users[cookieID];
  const templateVars = {
    user,
    urls: urlsForUser(cookieID, urlDatabase),
  };

  if (cookieID) {
    return res.render("urls_new", templateVars);
  }
  return res.redirect(`/login`);
});

// existing urls render page, send error message if not logged in

app.get("/urls", (req, res) => {
  const cookieID = req.session.userId;
  const filteredURLS = urlsForUser(cookieID, urlDatabase);
  const user = users[cookieID];
  if (cookieID) {
    const templateVars = {
      urls: filteredURLS,
      user,
    };
    return res.render("urls_index", templateVars);
  }
  return res.status(403).send("<h2>Login to see urls</h2>");
});

// url_show page (long and short versions)
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[req.params.id].longURL;
  const cookieID = req.session.userId;
  const userId = urlDatabase[req.params.id].userID; // user/cookie id
  const user = users[cookieID];
  const templateVars = { longURL, id, user };
  if (!user) {
    return res.send("<h2>Login to view URLS</h2>");
  }
  if (cookieID !== userId) {
    return res.send("<h2>not for you!!</h2>");
  }
  res.render("urls_show", templateVars);
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
