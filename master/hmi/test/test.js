var request = require("supertest");
var express = require("express");

const portRouter = require("../routes/serialPort");

const IP = "127.0.0.1";
const PORT = 3000;

describe("App", function () {
  var app;
  var server;

  before(function (done) {
    app = express();

    app.use(express.static("public"));
    app.use(express.urlencoded({ extended: true }));
    app.set("view engine", "ejs");

    app.use(
      "/serialPort",
      function (req, res, next) {
        req.server = server;
        next();
      },
      portRouter,
    );

    server = app.listen(PORT, IP, function () {
      done();
    });
  });

  after(function (done) {
    server.close(done);
  });

  describe("GET /", function () {
    it("should return 200 OK", function (done) {
      request(app)
        .get("/")
        .expect(200)
        .end(function (err, res) {
          if (err) return done(err);
          done();
        });
    });
  });
});
