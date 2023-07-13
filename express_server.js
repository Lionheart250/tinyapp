const express = require("express");
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10),
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.youtube.com/",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'], // Add your secret keys here
}));

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views", "partials")
]);

// Middleware function to check if user is logged in
// Add the static file middleware
app.use(express.static(path.join(__dirname, 'views')));
const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
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

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// User-specific URLs
app.get("/urls", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = urlsForUser(user.id);
  const templateVars = {
    urls: userURLs,
    user: user,
  };
  res.render("urls_index", templateVars);
});

// Create a new URL
app.get("/urls/new", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// Handle form submission to create a new URL
app.post("/urls", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
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

  const hashedPassword = bcrypt.hashSync(password, 10);

  const userID = generateRandomString();

  const newUser = {
    id: userID,
    email,
    password: hashedPassword,
  };

  users[userID] = newUser;

  req.session.user_id = userID;

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

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    res.status(403).send("Invalid password");
    return;
  }

  req.session.user_id = user.id;

  res.redirect("/urls");
});

// User logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Get JSON representation of URL database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Update a URL
app.post("/urls/:id", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
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

  const updatedLongURL = req.body.updatedLongURL;
  urlDatabase[shortURL].longURL = updatedLongURL;

  res.redirect('/urls');
});

// Delete a URL
app.post("/urls/:id/delete", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
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
  const user = users[req.session.user_id];
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
