const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
// const morgan = require("morgan");

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  cookieSession({
    name: "session",
    keys: ["gyfisdbiri", "iwirufhfhfhfhf0987hfhf"],
  })
);

// HELPERS

// returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id, urlDatabase) => {
  // console.log("urlDB:", urlDatabase);
  let filteredDB = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      filteredDB[key] = urlDatabase[key];
    }
  }
  // console.log("filteredDB:", filteredDB);
  return filteredDB;
};

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

/**
 * Function do user search by email or userID
 */
const getUser = (userID, email, users) => {
  if (userID) {
    for (const user in users) {
      if (users[user].userID === userID) {
        return users[user];
      }
    }

    return null;
  }

  if (email) {
    for (const user in users) {
      if (users[user].email === email) {
        return users[user];
      }
    }

    return null;
  }
};
// global object to store and access users in app
const users = {
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//keeps track of all the urls and their shortened forms
// the key is the short url id, the id is the cookie id
const urlDatabase = {
  // b2xVn2: {
  //   longURL: "http://www.lighthouselabs.ca",
  //   userID: "b2xVn2",
  // },
  // psm5xK: {
  //   longURL: "http://www.google.com",
  //   userID: "psm5xK",
  // },
};
// middleware
// app.use(morgan("dev"));

//ROUTES

// login page
//redirects to /urls if logged in
app.get("/login", (req, res) => {
  if (req.session.user_Id) {
    return res.redirect(`/urls`);
  }
  // let templateVars = { email, password, user: null, userID };
  let templateVars = { user: null };
  res.render("urls_login", templateVars);
});

// Post to urls
// submit form that shortens url, if not logged in says please login
app.post("/urls", (req, res) => {
  const cookieID = req.session.user_Id;
  // const userID = users[cookieID];
  const updatedURL = req.body.longURL;
  // console.log("updatedURL:", updatedURL);

  if (cookieID) {
    if (!updatedURL) {
      return res.status(400).send("<h2>Make sure to enter a valid url</h2>");
    }
    const id = generateRandomString();
    urlDatabase[id] = {
      longURL: updatedURL,
      userID: cookieID,
    };
    // console.log("urlDatabase:", urlDatabase);
    // newid-longURL key value pair save to urlDatabase
    return res.redirect(`/urls/${id}`); // need to redirect to /urls/:id
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
      console.log(users[id]);
      // res.cookie("user_Id", id);
      req.session.user_Id = id;
      return res.redirect("/urls");
    }
    return res.status(400).send("<h2>Sorry, that email already exists</h2>");
  }
  res.status(400).send("<h2>Please enter an email and password</h2>");
});
//register page, if logged in redirect to /urls
app.get("/register", (req, res) => {
  const email = req.body.email;
  // const user = getUser(email, urlDatabase);
  // const cookieID = req.cookies["user_Id"];
  const cookieID = req.session.user_Id;
  const id = req.params.id;
  // console.log("email:", email);
  // console.log("cookieID:", id);
  // console.log("reqparams register:", id);
  if (cookieID) {
    return res.redirect(`/urls`);
  }
  const templateVars = { id, user: null };
  // user: users[req.cookies["user_Id"]],
  res.render("urls_register", templateVars);
});

//redirect to longURl when click id, 404 if no longurl doesnt exist, if id doesnt exist send message
app.get("/u/:id", (req, res) => {
  // const longURL = urlDatabase[req.params.id].longURL;
  const cookieID = req.session.user_Id;
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
// delete new short url, redirect to urls_index

// currently trying to delete the urlBD at the cookie
// value not the short url value. cannot figure out how to get this right
//PROBLEMS
app.post("/urls/:id/delete", (req, res) => {
  const cookieID = req.session.user_Id;
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
  // console.log("post/login/user:", user);
  if (user === null) {
    return res.status(403).send("<h2>Sorry, user not found</h2>");
  }
  if (bcrypt.compareSync(password, user.password)) {
    // console.log("user:", user.id)
    req.session.user_Id = user.id;
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
// PROBLEMS
app.post("/urls/:id", (req, res) => {
  const cookieID = req.session.user_Id;
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

// render form page to generate new shortURL id and longURL pair; redirect to login if not logged in
app.get("/urls/new", (req, res) => {
  const cookieID = req.session.user_Id;
  const user = users[cookieID]; //user object for sp. cookie id
  // const urls = urlDatabase[userID];
  const templateVars = {
    user,
    urls: urlsForUser(cookieID, urlDatabase),
  };

  if (cookieID) {
    // console.log("Template:", templateVars);
    return res.render("urls_new", templateVars);
  }
  return res.redirect(`/login`);
});

// existing urls render page, send error message if not logged in
// MAYBE PROBLMES
app.get("/urls", (req, res) => {
  const cookieID = req.session.user_Id;
  // console.log("cookie id:", cookieID);
  const filteredURLS = urlsForUser(cookieID, urlDatabase);
  // console.log("filteredurls:", filteredURLS);
  const user = users[cookieID];

  // console.log("get(/urlscookieID:", cookieID);
  // console.log("get(/urlsUSERID:", users[cookieID]);

  if (cookieID) {
    // const currentUser = getUser(userID, null, users);
    const templateVars = {
      urls: filteredURLS,
      user,
    };
    return res.render("urls_index", templateVars);
  }
  return res.status(403).send("<h2>Login to see urls</h2>");
});

// url_show page (long and short versions)
// PROBLEMS
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[req.params.id].longURL;
  const cookieID = req.session.user_Id;
  const user_Id = urlDatabase[req.params.id].userID; // user/cookie id
  const user = users[cookieID];

  const templateVars = { longURL, id, user };

  // console.log("get/urls/:id id:", id);
  // console.log("get(/urlsuserID: userID ", cookieID);
  // console.log("get(/urlslongURL:", longURL);
  if (!user) {
    return res.send("<h2>Login to view URLS</h2>");
  }
  if (cookieID !== user_Id) {
    return res.send("<h2>not for you!!</h2>");
  }

  // console.log("templates:", templateVars);

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
