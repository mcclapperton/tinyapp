const express = require("express");
const app = express();
const PORT = 8080;
app.use(express.urlencoded({ extended: true }));
const cookieParser = require("cookie-parser");
app.set("view engine", "ejs");
app.use(cookieParser());
const morgan = require("morgan");

// returns the URLs where the userID is equal to the id of the currently logged-in user.
// const urlsForUser = (id) => {
//   let userUrls = {};
//   for (let id in urlDatabase) {
//     if (urlDatabase[id].userId === id) {
//       userUrls[id] = urlDatabase[id];
//     }
//   }
//   return userUrls;
// };

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
  // userID: {
  //   userID: "user2RandomID",
  //   email: "user2@example.com",
  //   password: "dishwasher-funk",
  // },
};

//keeps track of all the urls and their shortened forms
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "b2xVn2",
  },
  psm5xK: {
    longURL: "http://www.google.com",
    userID: "psm5xK",
  },
};
// middleware
app.use(morgan("dev"));
//ROUTES

// urls render page, send error message if not logged in
app.get("/urls", (req, res) => {
  const userID = req.cookies["user_Id"];

  // console.log('userCookies', userID)
  const currentUser = getUser(userID, null, users);

  // console.log('currentUser', currentUser)

  const templateVars = {
    urls: urlDatabase,
    user: currentUser,
  };
  res.render("urls_index", templateVars);
});

// render form page to generate new shortURL id and longURL pair; redirect to login if not logged in
app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_Id"]) {
    return res.redirect(`/login`);
  }

  const urls = urlDatabase[req.cookies["user_Id"]];

  const templateVars = { user: users[req.cookies["user_Id"]] };
  return res.render("urls_new", templateVars);
});
//register page, if logged in redirect to /urls
app.get("/register", (req, res) => {
  if (req.cookies["user_Id"]) {
    return res.redirect(`/urls`);
  }
  const templateVars = {
    user: users[req.cookies["user_Id"]],
  };
  res.render("urls_register", templateVars);
});
// login page
//redirects to /urls if logged in
app.get("/login", (req, res) => {
  if (req.cookies["user_Id"]) {
    res.redirect(`/urls`);
    return;
  }
  let templateVars = { user: users[req.cookies["user_Id"]] };
  res.render("urls_login", templateVars);
});

// url_show page (long and short versions)
app.get("/urls/:id", (req, res) => {
  // console.log("urlDatabase", urlDatabase);
  // console.log("req.params.id", req.params.id);
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_Id"]],
  };
  return res.render("urls_show", templateVars);
});

// allow to edit long url in show page
// redirects to edit page
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  urlDatabase[id].longURL = req.body.longURL;
  res.redirect(`/urls`);
  return res.render("urls_show", templateVars);

  // console.log('urlDatabase', urlDatabase)
  // console.log('req.params.id', req.params.id)
});
// submit form that shortens url, if not logged in says please login
app.post("/urls", (req, res) => {
  if (!req.cookies["user_Id"]) {
    res.statusCode = 403;
    res.send(`Please login to shorten your url`);
    return;
  }
  const newId = generateRandomString();
  urlDatabase[newId] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_Id"],
  }; // newid-longURL key value pair save to urlDatabase
  return res.redirect(`/urls/${newId}`); // need to redirect to /urls/:id
});
// delete new short url, redirect to urls_index
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});
//registration email and password
app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUser(null, req.body.email, users)) {
      const userID = generateRandomString();

      users[userID] = {
        userID,
        email: req.body.email,
        password: req.body.password,
      };
      res.cookie("user_Id", userID);
      res.redirect("/urls");
      return;
    } else {
      return res.status(400).send(`Sorry, that email already exists`);
    }
  }
  res.status(400).send(`Please enter an email and password`);
});
//redirect to longURl when click id, 404 if no longurl doesnt exist, if id doesnt exist send message
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
    res.redirect(longURL);
    return;
  }
  res.status(404).send(`404 page not found, this short URL does not exist`);
});
//login route
app.post("/login", (req, res) => {
  const user = getUser(null, req.body.email, users);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie("user_Id", user.userID);
      return res.redirect("/urls");
    } else {
      res.statusCode = 403;
      return res.send(`Please try again, password and email do not match`);
    }
  }
  res.statusCode = 403;
  return res.send(`Sorry, email not found`);
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
