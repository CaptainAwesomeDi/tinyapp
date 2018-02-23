"use strict";
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

app.set('view engine', 'ejs');

//use middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['TinyApp']
}));


const users = {};

const generateRandomString = () => {
  let shortUrl = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) { shortUrl += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return shortUrl;
};

//Find Duplicated Email
const findduplicateEmail = (email) => {
  for (let user in users ){
    if (users[user].email === email){
      return "found";
    } else {
      return "not found";
    }
  }
};


var urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userId: "1"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userId: "1"
  }
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      urls: urlDatabase,
      user_id: req.session.user_id
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.session.user_id
  };
  res.render("urls_show", templateVars);
});

//Update
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    shortURL: newShortURL,
    longURL: req.body.longURL,
    userId: req.session.user_id
  };
  res.redirect(302, `/urls/${newShortURL}`);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//redirect to a shortened URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if (!longURL) {
    res.redirect(404, "https://http.cat/404");
  } else {
    res.redirect(302, longURL);
  }
});

//Delete a link
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

//GET from /login
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//Post from /login
app.post("/login", (req, res) => {
  for (let user in users){
    if ((users[user].email === req.body.loginEmail) && (bcrypt.compareSync(req.body.loginPassword, users[user].password))){
      req.session.user_id = users[user].id;
      res.redirect('/urls');
    }else {
      res.status(400).send('incorrect Email or Password!');
    }
  }
});

//POST from /logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//GET from /register
app.get("/register", (req, res) => {
  res.render("urls_register");
});

//POST from /register
app.post("/register", (req, res) => {
  let userid = generateRandomString();
  users[userid] = {
    id: userid,
    email: "",
    password: ""
  };
  if (req.body.inputEmail === "" || req.body.inputPassword === "") {
    res.status(400).send('Please fill don\'t leave email or password field empty');
  } else if (findduplicateEmail(req.body.inputEmail) === "found") {
    res.status(400).send('This Email is already in use, please use another email');
  } else {
    users[userid].email = req.body.inputEmail;
    users[userid].password = bcrypt.hashSync(req.body.inputPassword, 10);
    req.session.user_id = users[userid].id;
    res.redirect("/urls");
  }


});


//Create a server
app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});
