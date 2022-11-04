// * Function do user search by email or userID
// */
const getUser = (userID, email, users) => {
  if (userID) {
    for (const user in users) {
      if (users[user].userID === userID) {
        return users[user];
      }
    }

    return undefined;
  }

  if (email) {
    for (const user in users) {
      if (users[user].email === email) {
        return users[user];
      }
    }

    return undefined;
  }
};

// returns the URLs of the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id, urlDatabase) => {

  let filteredDB = {};

  for (let key in urlDatabase) {

    if (urlDatabase[key].userID === id) {
      
      filteredDB[key] = urlDatabase[key];
    }
  }
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

module.exports = { getUser, generateRandomString, urlsForUser };
