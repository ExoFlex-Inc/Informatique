var express = require("express");

const portRouter = require("./routes/serialPort");

const IP = "10.0.0.1";
const PORT = 3000;

// Create the app
var app = express();

// This is for hosting files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Set up the server
// process.env.PORT is related to deploying on heroku
var server = app.listen(PORT, IP, onServerListen);

// This call back just tells us that the server has started
function onServerListen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log("App listening at http://" + host + ":" + port);
}

app.use(
  "/serialPort",
  function (req, res, next) {
    req.server = server;
    next();
  },
  portRouter
);
