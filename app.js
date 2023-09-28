var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/admin/users');
const tagsRouter = require('./routes/admin/tags');
const ingredientsRouter = require('./routes/admin/ingredients');
const authRouter = require('./routes/user/auth');
const createRecipeRoutes = require('./routes/user/create.recipe');
const newsfeedRoutes = require('./routes/user/newsfeed');
const favoriteRecipeRoutes = require('./routes/user/favorite.recipe');
const myprofileRoutes = require('./routes/user/myprofile');
const otherprofileRoutes = require('./routes/user/otherprofile');
const friendshipRoutes = require('./routes/user/friendship');


require('dotenv').config();

var app = express();

app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Thêm OPTIONS vào đây
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use('/uploads', express.static('uploads'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/tags', tagsRouter);
app.use('/ingredients', ingredientsRouter);

app.use('/auth', authRouter);
app.use('/recipes/create', createRecipeRoutes);
app.use('/favorite', favoriteRecipeRoutes);
app.use('/newsfeed', newsfeedRoutes);
app.use('/myprofile', myprofileRoutes);
app.use('/otherprofile', otherprofileRoutes);
app.use('/friendship', friendshipRoutes);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
