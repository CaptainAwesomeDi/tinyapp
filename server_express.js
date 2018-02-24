/********************************* IMPORTS *********************************/
"use strict";
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');

//allow express to process EJS files
app.set('view engine', 'ejs');

//use middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['TinyApp']
}));
app.use(methodOverride('_method'));

/********************************* VARIABLES *********************************/
// default port 8080
const PORT = process.env.PORT || 8080;
const users = {};
const urlDatabase = {
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

/********************************* FUNCTIONS *********************************/
//generate 6 digit random string
const generateRandomString = () => {
  let randomString = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) { randomString += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return randomString;
};

//find duplicated email
const findduplicateEmail = (email) => {
  for (let user in users ){
    if (users[user].email === email){
      return "found";
    } else {
      return "not found";
    }
  }
};

/********************************* DEFAULTS *********************************/
app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

/********************************* LIST PAGE *********************************/

//display list of urls
app.get("/urls", (req, res) => {
  console.log(urlDatabase);
  let templateVars = {
    urls: urlDatabase,
    user_id: req.session.user_id,
    visited: req.session.visited
  };
  res.render("urls_index", templateVars);
});

// allow /urls handle POST request
// newly generated short url added to the database
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = {
    shortURL: newShortURL,
    longURL: req.body.longURL,
    userId: req.session.user_id,
    visited:req.session.visited
  };
  res.redirect(302, `/urls/${newShortURL}`);
});

/*************************** CREATE NEW SHORT LINK ***************************/

//allow logged in user to create new short link
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

/****************************** URL DETAIL PAGE ******************************/

//display the newly generated shortURL with longURL with editing options
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.session.user_id,
    visited: req.session.visted
  };
  res.render("urls_show", templateVars);
});

//allow user to change longURL without changing shortURL
app.put("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});



//redirect to a shortened URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  if(urlDatabase[req.params.shortURL].visited === undefined){
    urlDatabase[req.params.shortURL].visited = 1;
  } else {
    urlDatabase[req.params.shortURL].visited += 1;
  }
  if (!longURL) {
    res.redirect(404, "https://http.cat/404");
  } else {
    res.redirect(302, longURL);
  }

});

//Delete a link
app.delete("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

/******************************* USER FEATURE *******************************/
//renders the login page
app.get("/login", (req, res) => {
  res.render("urls_login");
});

//check if the user is in the database
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

//when user
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


/******************************* CREATE SERVER *******************************/
app.listen(PORT, () => {
  console.log(`TinyURL app listening on port ${PORT}!`);
});
