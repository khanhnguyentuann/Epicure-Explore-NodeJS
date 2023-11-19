var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

const http = require('http');
const setupSocket = require('./routes/user/socket-chat');
const dashboardRouter = require('./routes/admin/dashboard');
const commentsRouter = require('./routes/admin/comments');
const usersRouter = require('./routes/admin/users');
const tagsRouter = require('./routes/admin/tags');
const ingredientsRouter = require('./routes/admin/ingredients');
const recipesRouter = require('./routes/admin/recipes');
const authRouter = require('./routes/user/user-authentication');
const createRecipeRoutes = require('./routes/user/create-post');
const newsfeedRoutes = require('./routes/user/newsfeed');
const notificationRoutes = require('./routes/user/notification');
const favoriteRecipeRoutes = require('./routes/user/favorite-post');
const myprofileRoutes = require('./routes/user/user-profile');
const otherprofileRoutes = require('./routes/user/another-user-profile');
const friendshipRoutes = require('./routes/user/friendship');
const searchRoutes = require('./routes/user/search');
const chatRoutes = require('./routes/user/conversation');
const userChatRoutes = require('./routes/user/user-chat');

require('dotenv').config();

var app = express();
var server = http.createServer(app); // Khởi tạo server từ app

// Cài đặt và sử dụng Socket.IO
const io = setupSocket(server); // Sử dụng hàm từ socket.js

app.use(cors({
  origin: "http://localhost:8080",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

app.use('/dashboard', dashboardRouter);
app.use('/comments', commentsRouter);
app.use('/users', usersRouter);
app.use('/tags', tagsRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/recipes', recipesRouter);

app.use('/auth', authRouter);
app.use('/recipes/create', createRecipeRoutes);
app.use('/favorite', favoriteRecipeRoutes);
app.use('/newsfeed', newsfeedRoutes);
app.use('/notification', notificationRoutes);
app.use('/myprofile', myprofileRoutes);
app.use('/otherprofile', otherprofileRoutes);
app.use('/friendship', friendshipRoutes);
app.use('/search', searchRoutes);
app.use('/conversation', chatRoutes);
app.use('/userchat', userChatRoutes);

// Catch 404 và forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app, server, io };
