
var socket = io();
var portNameGlobal;

socket.on("data", function (data) {
  document.getElementById("arduino_msg").innerHTML = data;
  button = document.getElementById("serial_port");
  if (button.innerHTML !== null) {
    button.disabled = true;
    button.innerHTML = portNameGlobal;
    button.value = "Connected";
  }
});
socket.on("portName", function (portName) {
  button = document.getElementById("serial_port");
  if (portName === null) {
    button.disabled = true;
    button.value = "Not Connected";
    button.innerHTML = portName;
  } else if (button.value === "Not Connected") {
    button.disabled = false;
    button.innerHTML = portName;
  }
  portNameGlobal = portName;
});

function connectPort() {
  button = document.getElementById("serial_port");
  if (button.innerHTML !== null) {
    socket.emit("portConnect");
    button.disabled = true;
    button.value = "Connected";
  }
}

function manualButton(button) {
  socket.emit("manualMovement", { Case: button });
}
