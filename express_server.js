var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set('view engine', 'ejs');

const generateRandomString = function () {
  return Math.random().toString(36).slice(2,8);
}

const generateRandomUserID = function () {
  return (
    Math.random().toString(36).replace(/\d/g,"").slice(2,6)+
    Math.floor(Math.random() * (9999-1000) + 1000)
    );
}

const users = {
  "kamy9725": {
    id: "kamy9725",
    email: "kamy9725@example.com",
    password: "kamy9725pass"
  },
 "tkss9726": {
    id: "tkss9726",
    email: "tkss9726@example.com",
    password: "tkss9726pass"
  }
}

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.post('/login', (req, res) => {
  res.cookie('user_id', req.body.username);
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  res.render('register');
})

app.post('/register', (req, res) => {
  let found = false;
  Object.keys(users).forEach(function(user) {
    if (users[user].email == req.body.email) {
      found = true;
    }
  })
  if (found == true) {
      res.status(400).send('This email address is already registered.');
  } else if (req.body.email && req.body.password) {
    let newUser = {
      id: generateRandomUserID(),
      email: req.body.email,
      password: req.body.password
    }
    users[newUser.id] = newUser;
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  } else {
    res.status(400).send('Please register with an email address and a password.');
  }
})

app.get('/urls', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
    // cookie: req.cookies['user_id'],
    urls: urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  let newKey = generateRandomString();
  let newValue = req.body.longURL;
  urlDatabase[newKey] = newValue;
  res.redirect(`urls/${newKey}`);
});

app.get('/urls/new', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
  }
  res.render('urls_new', templateVars);
})

app.get('/urls/:id', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id']],
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]
  }
  res.render('urls_show', templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id] = req.body.update;
  res.redirect('/urls');
})

app.get('/u/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.redirect(templateVars.longURL);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});









// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/', (req, res) => {
//   res.end('Hello!');
// });

// app.get('/hello', (req, res) => {
//   res.end('<html><body>Hello <b>World</b></body></html>\n');
// });