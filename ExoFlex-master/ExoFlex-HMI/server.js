var http = require("http");
var fs = require("fs");
var path = require("path");
var url = require("url");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

var port = null;

var parser = null;

var server = http
  .createServer(function (req, res) {
    if (req.url === "/" || req.url === "/index.html") {
      fs.readFile("./index.html", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/Debug.html") {
      fs.readFile("./Debug.html", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/Controle.html") {
      fs.readFile("./Controle.html", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/Serrage.html") {
      fs.readFile("./Serrage.html", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/js/home_functions.js") {
      fs.readFile("js/home_functions.js", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/js/controle_functions.js") {
      fs.readFile("js/controle_functions.js", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/js/serrage_functions.js") {
      fs.readFile("js/serrage_functions.js", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/js/debug_functions.js") {
      fs.readFile("js/debug_functions.js", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/js/socket.io.js") {
      fs.readFile("js/socket.io.js", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.write(data);
        res.end();
        return;
      });
      } else if (req.url === "/js/jquery-3.3.1.slim.min.js") {
        fs.readFile("js/jquery-3.3.1.slim.min.js", function (err, data) {
          if (err) {
            throw err;
          }
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.write(data);
          res.end();
          return;
        });
      } else if (req.url === "/js/bootstrap.min.js") {
        fs.readFile("js/bootstrap.min.js", function (err, data) {
          if (err) {
            throw err;
          }
          res.writeHead(200, { "Content-Type": "text/javascript" });
          res.write(data);
          res.end();
          return;
        });
    } else if (req.url === "/css/bootstrap.min.css") {
      fs.readFile("css/bootstrap.min.css", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/css" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/css/dashboard.css") {
      fs.readFile("css/dashboard.css", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "text/css" });
        res.write(data);
        res.end();
        return;
      });
    } else if (req.url === "/img/ExoFlex.png") {
      fs.readFile("img/ExoFlex.png", function (err, data) {
        if (err) {
          throw err;
        }
        res.writeHead(200, { "Content-Type": "image/png" });
        res.write(data);
        res.end();
        return;
      });
    }
  })
  .listen(5500,'10.0.0.1');

var io = require("socket.io")(server);

io.on("connection", function (socket) {
  console.log("Server is listening");

  socket.on("portConnect", function (data) {
    port = new SerialPort({
      path: "/dev/ttyACM0",
      // path: "/dev/cu.usbmodem11101",
      baudRate: 115200,
    });

    parser = port.pipe(new ReadlineParser({ delimiter: "*" }));

    // Read the port data
    port.on("open", () => {
      console.log("Serial port on");
    });

    port.on("error", (error) => {
      console.log(error);
    });

    parser.on("data", function (data) {
      console.log(data);

      io.emit("data", data);
    });
  });

  socket.on("manualMovement", function (msg) {
    msg = JSON.stringify(msg);

    port.write(msg);
  });

});

function getPortsList() {
  SerialPort.list().then(function (ports) {
    const scannerPort = ports.filter(
      (port) => port.manufacturer === "Arduino (www.arduino.cc)"
    );
    if (scannerPort.length !== 0) {
      io.emit("portName", scannerPort[0].path);
    } else {
      io.emit("portName", null);
      port = null;
    }
  });
}

setInterval(function () {
  getPortsList();
}, 1000);
