const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
const path = require('path');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views", "partials")
]);
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

// Define an object to hold the URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Middleware to pass the username to all views
app.use((req, res, next) => {
  res.locals.username = req.cookies["username"];
  next();
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/login", (req, res) => {
  const username = req.body.username;

  // Perform login logic here

  // Set the cookie
  res.cookie("username", username);
  res.redirect("/"); // Redirect to the desired page after login
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  // Delete the URL resource using the 'delete' operator
  delete urlDatabase[id];

  // Redirect the client back to the urls_index page
  res.redirect('/urls');
});

app.post('/urls/:id/update', (req, res) => {
  const id = req.params.id;
  const updatedLongURL = req.body.updatedLongURL;

  // Update the URL resource
  urlDatabase[id] = updatedLongURL;

  // Redirect the client back to the urls_index page
  res.redirect('/urls');
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; // Get the short URL from the request parameters
  const longURL = urlDatabase[shortURL]; // Get the corresponding long URL from the urlDatabase

  if (longURL) {
    res.redirect(longURL); // Redirect to the long URL
  } else {
    res.sendStatus(404); // If the short URL is not found, send a 404 Not Found status
  }
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
