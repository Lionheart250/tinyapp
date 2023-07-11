const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

function generateRandomString() {}

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Define an object to hold the URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// POST route for deleting a URL resource
app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;

  // Delete the URL resource using the 'delete' operator
  delete urlDatabase[id];

  // Redirect the client back to the urls_index page
  res.redirect('/urls');
});

// POST route for updating a URL resource
app.post('/urls/:id/update', (req, res) => {
  const id = req.params.id;
  const updatedLongURL = req.body.updatedLongURL;

  // Update the URL resource
  urlDatabase[id] = updatedLongURL;

  // Redirect the client back to the urls_index page
  res.redirect('/urls');
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { 
    id: req.params.id, longURL: urlDatabase[req.params.id] 
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
