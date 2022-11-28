const express = require("express");
const router = express.Router();

var fs = require("fs");

var port;
var parser;

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

router.post("/", (req, res) => {
  var anglesData = fs.readFileSync("json/angles.json");
  var angles = JSON.parse(anglesData);

  SerialPort.list().then(function (ports) {
    const scannerPort = ports.filter(
      (port) => port.manufacturer === "Arduino (www.arduino.cc)"
      // (port) => port.productId === "7523" //CHANGE
    );
    if (scannerPort.length !== 0) {
      port = new SerialPort({
        path: scannerPort[0].path,
        baudRate: 115200,
      });

      // Read the port data
      port.on("open", () => {
        console.log("Serial port on");
      });

      port.on("close", () => {
        console.log("Serial port closed");
      });

      port.on("error", (error) => {
        console.log(error);
      });

      parser = port.pipe(new ReadlineParser({ delimiter: "*" }));

      var io = require("socket.io")(req.server);

      io.on("connection", function (socket) {
        console.log("Socket is listening");

        parser.on("data", function (data) {
          data = JSON.parse(data);

          if (data.DorsiflexAngle === -180 && data.EversionAngle === -180) {
            // -180 = undefined with mapping
            msg = JSON.stringify({
              Case: 0,
              DorsiflexAngle: angles.DorsiflexAngle,
              EversionAngle: angles.EversionAngle,
              TighteningAngle: angles.TighteningAngle,
            });

            port.write(msg);

            // angles.DorsiflexAngle = 0;
            // angles.EversionAngle = 0;
            // angles.TighteningAngle = 0;
            // fs.writeFileSync("json/angles.json", JSON.stringify(angles));
          }
          console.log(data);

          if (angles.DorsiflexAngle !== data.DorsiflexAngle) {
            angles.DorsiflexAngle = data.DorsiflexAngle;
            fs.writeFileSync("json/angles.json", JSON.stringify(angles));
          }
          if (angles.EversionAngle !== data.EversionAngle) {
            angles.EversionAngle = data.EversionAngle;
            fs.writeFileSync("json/angles.json", JSON.stringify(angles));
          }

          io.emit("data", data);
        });

        socket.on("manualMovement", function (msg) {
          if (msg.TighteningAngle !== undefined) {
            angles.TighteningAngle = msg.TighteningAngle;
            fs.writeFileSync("json/angles.json", JSON.stringify(angles));
          }
          msg = JSON.stringify(msg);

          port.write(msg);
        });
      });

      res.redirect("/Serrage.html");
    } else {
      console.log("No Arduino serial port detected!");
    }
  });
});

module.exports = router;
