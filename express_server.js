const cookieSession = require('cookie-session');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const generateRandomString = function () {
  return Math.random().toString(36).slice(2,8);
}

const generateRandomUserID = function () {
  return (
    Math.random().toString(36).replace(/\d/g,"").slice(2,6)+
    Math.floor(Math.random() * (9999-1000) + 1000)
    );
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession( {
  name: 'session',
  keys: ['thisisthebestsecretkeyforcookies']
  }));
app.set('view engine', 'ejs');

const checkUser = function (req, res, next) {
  if (req.path.match(/login|register/)) {
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

app.use(checkUser);

function urlsForUser (id) {
  let filteredData = {};
  for (item in urlDatabase) {
    if (urlDatabase[item]['userID'] === id) {
      filteredData[item] = urlDatabase[item];
    }
  }
  return filteredData;
}

const users = {
  "kamy9725": {
    id: "kamy9725",
    email: "kamy9725@example.com",
    hashedPassword: "$2a$10$jyR9nPTMHU.W/PtMjzKySuaHcADmU6mWodfH0waTqQfyUTW5R7ouO"
  },
 "tkss9726": {
    id: "tkss9726",
    email: "tkss9726@example.com",
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







app.get('/', (req, res) => {
    res.send('Hello!');
});

app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render('login', templateVars);
})

app.get('/login/prompt', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render('login_prompt', templateVars);
})

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
      res.redirect('/');
    } else {
      res.status(403).send('Incorrect password.');
    }
  } else {
    res.status(403).send('This email address is not registered');
  }
})

app.post('/logout', (req, res) => {
  req.session.user_id = '';
  res.redirect('/urls');
})

app.get('/register', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  }
  res.render('register', templateVars);
})

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
      password: req.body.password,
      hashedPassword: bcrypt.hashSync(req.body.password, 10)
    }
    users[newUser.id] = newUser;
    req.session.user_id = newUser.id;
    res.redirect('/urls');
  } else {
    res.status(400).send('Please register with an email address and a password.');
  }
})

app.get('/urls', (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls: urlsForUser(req.session.user_id),
  };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  let newKey = generateRandomString();
  let newValue = req.body.longURL;
  urlDatabase[newKey] = {
    longURL: newValue,
    userID: req.session.user_id
  };
  res.redirect(`urls/${newKey}`);
});

app.get('/urls/new', (req, res) => {
    let templateVars = {
      user: users[req.session.user_id],
    }
    res.render('urls_new', templateVars);
})

app.get('/urls/:id', (req, res) => {
    let templateVars = {
      user: users[req.session.user_id],
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id]['longURL'],
      userIDCreator: urlDatabase[req.params.id]['userID']
    }
    res.render('urls_show', templateVars);
});

app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
})

app.post('/urls/:id/update', (req, res) => {
  urlDatabase[req.params.id]['longURL'] = req.body.update;
  res.redirect(`/urls/${req.params.id}`);
})

app.get('/u/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]['longURL'],
    userIDCreator: urlDatabase[req.params.shortURL]['userID']
  };
  res.redirect(templateVars.longURL);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});









// app.get('/urls.json', (req, res) => {
//   res.json(urlDatabase);
// });

// app.get('/hello', (req, res) => {
//   res.end('<html><body>Hello <b>World</b></body></html>\n');
// });