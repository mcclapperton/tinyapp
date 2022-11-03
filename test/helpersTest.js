const { assert } = require("chai");

const { urlsForUser, getUser, generateRandomString } = require("../helpers");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe("getUser", function () {
  it("should return a user with valid email", function () {
    const user = getUser(null, "user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(expectedUserID, user.id);
  });
});

describe("getUser", function () {
  it("should return undefined with a non-existant email", function () {
    const user = getUser(null, "hello@example.com", testUsers);
    const expectedUserID = undefined;
    assert.equal(expectedUserID, user);
  });
});
