"use strict";
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');

//use middleware
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

// How do I utlize middleware to pass same info
// app.use((req, res, next) => {
//   res.locals.user_id = req.cookies["user_id"]
//   next();
// });


const users = {};

const generateRandomString = () => {
  let shortUrl = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    shortUrl += possible.charAt(Math.floor(Math.random() * possible.length));
  return shortUrl;
}


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

//Update
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect(302, `/urls/${newShortURL}`);
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//redirect to a shortened URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
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
  res.render("urls_login")
  //console.log('Cookies:' + req.cookies["user_id"]);
});
//Post from /login
app.post("/login", (req, res) => {
  console.log('loginemail',req.body.loginEmail);
  console.log('loginpassword',req.body.loginPassword);
  for (let user in users){
    if ((users[user].email === req.body.loginEmail) && (users[user].password === req.body.loginPassword)){
        res.cookie('user_id',users[user].id);
        res.redirect('/urls');
      }else {
        res.status(400).send('incorrect username or password!');
      }
  }
  // users.forEach((user)=>{
  //   if ((user.email === req.body.loginEmail) && (user.password === req.body.loginPassword)){
  //     res.cookie('user_id',userid)
  //   }else {
  //     res.status(400).send('incorrect username or password!');
  //   }
  // });
  //res.cookie('username', req.body.username);
  res.send("Success");
});

//POST from /logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('username');
  res.clearCookie('Email');
  res.clearCookie('Password');
  res.clearCookie('userId');
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
  } else if (findduplicateEmail(req.body.inputEmail)==="found") {
    res.status(400).send('This Email is already in use, please use another email')
  } else {
    users[userid].email = req.body.inputEmail;
    users[userid].password = req.body.inputPassword;
    res.cookie("user_id", userid);
    console.log(users);
    res.redirect("/urls");
  }


});


//Create a server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const findduplicateEmail = (email) => {
  for (let user in users ){
    console.log(users[user].email);
    if (users[user].email === email){
      return "found";
    } else {
      return "not found";
    }
  }
}
