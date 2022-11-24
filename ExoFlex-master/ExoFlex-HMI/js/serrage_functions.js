var socket = io();
let TightAngle = 0;

$(".mainpage button").attr("disabled", true);
$("#controllink").attr("href","Controle.html?lock=on")
$( "#lock" ).on( "change", function() {
    if( $(this).val() == "on"){
        $(this).val("off");
        $(".mainpage button").attr("disabled", false);
        $(".mainpage h2").text("Unlocked");
        $("#controllink").attr("href","Controle.html?lock=off")
    }
    else{
        $(this).val("on");
        $(".mainpage button").attr("disabled", true);
        $(".mainpage h2").text("Locked");
        $("#controllink").attr("href","Controle.html?lock=on")
    }
});

function tighteningTight() {
    tightenning_interval = setInterval(function () {
      if( TightAngle < 180){
        TightAngle += 5;
        socket.emit("manualMovement", { TightAngle: TightAngle,
        Case: 6 });
      }
    }, 100);
  };
  function tighteningUntight() {
    tightenning_interval = setInterval(function () {
      if( TightAngle > 0 ){
        TightAngle -= 5;
        socket.emit("manualMovement", { TightAngle: TightAngle,
        Case: 6 });
      }
    }, 100);
  };
  
  function tighteningStop() {
      clearInterval( tightenning_interval );
  };
