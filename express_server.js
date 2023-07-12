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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

// Middleware function to check if user is logged in
const requireLogin = (req, res, next) => {
  const user = res.locals.user;
  if (!user) {
    res.redirect("/login");
  } else {
    next();
  }
};

// Function to filter URLs by userID
const urlsForUser = (id) => {
  const filteredURLs = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      filteredURLs[key] = urlDatabase[key];
    }
  }
  return filteredURLs;
};

// Routes

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// User-specific URLs
app.get("/urls", requireLogin, (req, res) => {
  const user = res.locals.user;
  const userURLs = urlsForUser(user.id);
  const templateVars = {
    urls: userURLs,
    user: user,
  };
  res.render("urls_index", templateVars);
});

// Create a new URL
app.get("/urls/new", requireLogin, (req, res) => {
  const user = res.locals.user;
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// Handle form submission to create a new URL
app.post("/urls", requireLogin, (req, res) => {
  const user = res.locals.user;
  if (!user) {
    res.status(403).send("You must be logged in to shorten URLs.");
    return;
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: user.id,
  };

  res.redirect("/urls");
});

// Generate a random string for short URLs
const generateRandomString = () => {
  const length = 6;
  return Math.random().toString(36).substring(2, 2 + length);
};

// User registration
app.get("/register", (req, res) => {
  res.render("register");
});

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

// User login
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

// User logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// Get JSON representation of URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Delete a URL
app.post("/urls/:id/delete", requireLogin, (req, res) => {
  const user = res.locals.user;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    res.status(404).send("Short URL does not exist");
    return;
  }

  if (url.userID !== user.id) {
    res.status(403).send("You do not own this URL");
    return;
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// View a URL
app.get("/urls/:id", requireLogin, (req, res) => {
  const user = res.locals.user;
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    res.status(404).send("Short URL does not exist");
    return;
  }

  if (url.userID !== user.id) {
    res.status(403).send("You do not own this URL");
    return;
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: url.longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

// Redirect to the long URL when a short URL is accessed
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).render("error", { message: "Short URL does not exist" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
