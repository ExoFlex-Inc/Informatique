var socket = io();

let TighteningAngle = 0;

$(".mainpage button").attr("disabled", true);
$("#controllink").attr("href", "Controle.html?lock=on");
$("#lock").on("change", function () {
  if ($(this).val() == "on") {
    $(this).val("off");
    $(".mainpage button").attr("disabled", false);
    $(".mainpage h2").text("Unlocked");
    $("#controllink").attr("href", "Controle.html?lock=off");
  } else {
    $(this).val("on");
    $(".mainpage button").attr("disabled", true);
    $(".mainpage h2").text("Locked");
    $("#controllink").attr("href", "Controle.html?lock=on");
  }
});

function tighteningTight() {
  tightening_interval = setInterval(function () {
    if (TighteningAngle < 180) {
      TighteningAngle += 5;
      socket.emit("manualMovement", {
        TighteningAngle: TighteningAngle,
        Case: 6,
      });
    }
  }, 100);
}
function tighteningUntight() {
  tightening_interval = setInterval(function () {
    if (TighteningAngle > 0) {
      TighteningAngle -= 5;
      socket.emit("manualMovement", {
        TighteningAngle: TighteningAngle,
        Case: 6,
      });
    }
  }, 100);
}

function tighteningStop() {
  clearInterval(tightening_interval);
}
