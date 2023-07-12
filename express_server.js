const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const path = require('path');

const users = {
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views", "partials")
]);

app.use((req, res, next) => {
  res.locals.user = users[req.cookies.user_id];
  next();
});

const generateRandomString = () => {
  const length = 6;
  return Math.random().toString(36).substring(2, 2 + length);
};

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password fields are required");
    return;
  }

  const existingUser = Object.values(users).find(
    (user) => user.email === email
  );
  if (existingUser) {
    res.status(400).send("Email already registered");
    return;
  }

  const userID = generateRandomString();

  const newUser = {
    id: userID,
    email,
    password,
  };

  users[userID] = newUser;

  res.cookie("user_id", userID);

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = Object.values(users).find((user) => user.email === email);

  if (!user) {
    res.status(403).send("Invalid email");
    return;
  }

  if (user.password !== password) {
    res.status(403).send("Invalid password");
    return;
  }

  res.cookie("user_id", user.id);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: res.locals.user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: res.locals.user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  delete urlDatabase[id];

  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => {
  const id = req.params.id;
  const updatedLongURL = req.body.updatedLongURL;

  urlDatabase[id] = updatedLongURL;

  res.redirect('/urls');
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.sendStatus(404);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
