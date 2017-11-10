//TinyApp Server

//requiring resources
const cookieSession = require('cookie-session');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

//random generator functions for IDs
const generateRandomString = function () {
  return Math.random().toString(36).slice(2,8);
}

const generateRandomUserID = function () {
  return (
    Math.random().toString(36).replace(/\d/g,"").slice(2,6)+
    Math.floor(Math.random() * (9999-1000) + 1000)
  );
}

//function for checking if a user is already logged
const checkUser = function (req, res, next) {
  if (req.path.match(/login|register|u\//)) {
    next();
    return;
  }
  const currentUser = req.session.user_id;
  if (currentUser) {
    req.currentUser = currentUser;
    next();
  } else {
    res.redirect('/login/prompt');
  }
}

//function for filtering urls database for users
function urlsForUser (id) {
  let filteredData = {};
  for (item in urlDatabase) {
    if (urlDatabase[item]['userID'] === id) {
      filteredData[item] = urlDatabase[item];
    }
  }
  return filteredData;
}

//launching resources
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession( {
  name: 'session',
  keys: ['thisisthebestsecretkeyforcookies']
  }));
app.set('view engine', 'ejs');
app.use(checkUser);

//databases: users and urls
//hardcoded examples for testing
const users = {
  "kamy9725": {
    id: "kamy9725",
    email: "kamy9725@example.com",
    password: 'kamy9725pass',
    hashedPassword: "$2a$10$jyR9nPTMHU.W/PtMjzKySuaHcADmU6mWodfH0waTqQfyUTW5R7ouO"
  },
 "tkss9726": {
    id: "tkss9726",
    email: "tkss9726@example.com",
    password: 'tkss9726pass',
    hashedPassword: "$2a$10$8PYL0DXWTrGaN03cdQ7UMembYs5HjA798VjOfyqTKmkWmweytL6vK"
  }
}

const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'hardcoded'
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'hardcoded'
  }
};

//root directory is redirected to the user's (if logged) library
app.get('/', (req, res) => {
  res.redirect('/urls');
});

//login page rendering - also capturing users who are already logged in
app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    let templateVars = {
      user: users[req.session.user_id],
    }
  res.render('login', templateVars);
  }
})

//login prompt page rendering: unlogged users are prompted to log in or register
app.get('/login/prompt', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render('login_prompt', templateVars);
})

//upon post request to login page, the users' email is compared against database;
//errors if incorrect data; correct logins are logged with cookies and redirected
app.post('/login', (req, res) => {
  let loggedUser = "";
  let emailCheck = function () {
    for (person in users) {
      if (users[person].email === req.body.email) {
        loggedUser = users[person].id;
      }
    }
  }()
  if (loggedUser) {
    if (bcrypt.compareSync(req.body.password, users[loggedUser].hashedPassword)) {
      req.session.user_id = loggedUser;
      res.redirect('/urls');
    } else {
      res.status(403).send('Incorrect password.');
    }
  } else {
    res.status(403).send('This email address is not registered');
  }
})

//logout request clears user_id cookie and redirects to login page
app.post('/logout', (req, res) => {
  req.session.user_id = '';
  res.redirect('/login');
})

//register page renders
app.get('/register', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render('register', templateVars);
  }
})

//upon registration request, data is checked for completeness and email is checked against database
//upon successful registration, new user is added with generated ID and hashed password
//and cookie applied; unsuccessful registrations send error messages
app.post('/register', (req, res) => {
  let found = false;
  Object.keys(users).forEach(function(user) {
    if (users[user].email === req.body.email) {
      found = true;
    }
  })
  if (found == true) {
    res.status(400).send('This email address is already registered.');
  } else if (req.body.email && req.body.password) {
    let newUser = {
      id: generateRandomUserID(),
      email: req.body.email,
      hashedPassword: bcrypt.hashSync(req.body.password, 10)
    }
    users[newUser.id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect('/urls');
  } else {
      res.status(400).send('Please register with an email address and a password.');
  }
})

//urls page (aka library) renders
//url database is pre-filtered according to user's access rights
app.get('/urls', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id),
  };
  res.render('urls_index', templateVars);
});

//upon post request, an ID is generated for the new URL
//short and original URLs are written into the database
//redirection to the new URL's edit page
app.post('/urls', (req, res) => {
  let newKey = generateRandomString();
  let newValue = req.body.longURL;
  urlDatabase[newKey] = {
    longURL: newValue,
    userID: req.session.user_id
  };
  res.redirect(`urls/${newKey}`);
});

//rendering page for new URL entries
app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    }
  res.render('urls_new', templateVars);
})

//rendering URL edit page upon URL-specific request
app.get('/urls/:id', (req, res) => {
  if (urlDatabase[req.params.id]) {
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id]['longURL'],
      userIDCreator: urlDatabase[req.params.id]['userID']
    }
    if (templateVars.user.id == templateVars.userIDCreator) {
      res.render('urls_show', templateVars);
    } else {
      res.redirect('/urls');
    }
  } else {
    res.redirect('/urls');
  }
});

//deleting URL entry from database upon request
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

//updating URL entry upon request
app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id]['longURL'] = req.body.update;
  res.redirect(`/urls/${req.params.id}`);
})

//rediricting short URL to the long URL destination
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL]['longURL'],
      userIDCreator: urlDatabase[req.params.shortURL]['userID']
    };
  res.redirect(templateVars.longURL);
  } else {
    res.send('This TinyApp URL is not registered.');
  }
})

//server set to listening
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


