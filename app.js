var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var session = require("express-session");
var fileUpload = require("express-fileupload");
require('dotenv').config();

var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");

var hbs = require("express-handlebars");
var app = express();
var db = require("./config/connection");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    helpers: {
      inc: function (value, options) {
        return parseInt(value) + 1;
      },
      multiply: function (a, b) {
        return a * b;
      },
    },
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: "Key",
    cookie: { maxAge: 600000 },
    saveUninitialized: true,
    resave: true,
  })
);
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "public")));

db.connect((err) => {
  if (err) console.log("connection error" + err);
  else console.log("Database connected to port 27017");
});
app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
