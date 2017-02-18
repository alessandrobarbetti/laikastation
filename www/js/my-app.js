
 
// Initialize app
var myApp = new Framework7({
                    modalTitle: "Laika Station"
                });

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var ble_v=myApp.addView('#ble');
var stazione_v=myApp.addView('#stazione');
var impostazioni_v=myApp.addView('#impostazioni');
var avanzate=myApp.addView('#avanzate');

var stzService_uuid = "da721f52-d970-11e6-bf26-cec0c932ce01";
var lat_uuid = "f321fb70-d971-11e6-bf26-cec0c932ce01";
var lon_uuid = "f321fdb4-d971-11e6-bf26-cec0c932ce01";
var tempo_monit_uuid = "f321feae-d971-11e6-bf26-cec0c932ce01";
var isLaika_uuid = "9e6850ba-d972-11e6-bf26-cec0c932ce01";

var day_uuid = "d02d0988-edd6-11e6-bc64-92361f002671";
var month_uuid = "d02d0f46-edd6-11e6-bc64-92361f002671";
var year_uuid = "d02d1130-edd6-11e6-bc64-92361f002671";
var hour_uuid = "d02d12de-edd6-11e6-bc64-92361f002671";
var minute_uuid = "d02d14e6-edd6-11e6-bc64-92361f002671";
var second_uuid = "d02d1694-edd6-11e6-bc64-92361f002671";

var day = "01";
var month = "01";
var year = "2017";
var hour = "00";
var minute = "00";
var second = "00";

var lat = 0;
var lon = 0;
var tempo_monitoraggio = 0;

var dev = null;

var devices = [];
var millisScan = 5000;

var stz = null;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    ble.isEnabled(function() { startDeviceScan(); },
        function() { 
            ble.enable( function(){ startDeviceScan(); }, 
                        function(){ myApp.alert("L'app non è riuscita ad abilitare il Bluetooth. Abilitarlo dalle impostazione del elefono e riavviare l'app."); }
                        );
        });
});


$$(document).on('resume', function() {
    if(dev != null){
        ble.isConnected(dev.id, function(){ getStatus() }, function(){
            ble.enable( function(){ startDeviceScan(); }, 
                        function(){ myApp.alert("L'app non è riuscita ad abilitare il Bluetooth. Abilitarlo dalle impostazione del elefono e riavviare l'app."); }
                        );
        });
    }
});

function startDeviceScan(){

    $('#ble-devices').hide();

    $(".spinner-text").html("Bluetooth scanning...");
    $(".spinner-block").fadeIn('fast');

    devices = [];

    ble.startScan([], function(device) { devices.push(device); }, function(){});
    
    setTimeout(ble.stopScan, millisScan,
        function() { 
            $(".spinner-text").html("");
            $(".spinner-block").fadeOut('fast', function(){
                listDevices(devices);
            });
        },
        function() { console.log("stopScan failed"); }
    );
}

function listDevices(devices){

    $('#ble-devices ul').html("");
    if(devices.length > 0){   
        for(var i = 0; i < devices.length; i++){
            var el = '<li class="item-content" onclick="connectToDevice('+i+')"><div class="item-inner"><div class="item-title">'+devices[i].name+'</div><div class="item-after">'+devices[i].id+'</div></div></li>';
            $('#ble-devices ul').append(el);
        }
    }else{
        $('#ble-devices ul').html('<li class="item-content"><div class="item-inner"><div class="item-title">Nessun device trovato.</div></li>');
    }

    $('#ble-devices').fadeIn('fast');
}

function connectToDevice(i){
    dev = devices[i];
    ble.connect(dev.id, function(){
                ble.read(dev.id, stzService_uuid, isLaika_uuid, function(s){ var k = bytesToInt(s); if(k != 1){ disconnect(); myApp.alert("Periferica non riconosciuta."); }else{ getStatus(); } }, function(){ myApp.alert("Errore durante la connessione al device."); disconnect(); });
                //ble.write(dev_id, stzService_uuid, lat_uuid, floatToBytes(20.1234),function(){ alert("Written"); }, function(){alert("error");});
                //var tx_buffer = stringToBytes("12345678912345678912");
                //ble.writeWithoutResponse(dev_id, uart_service, tx, stringToBytes("12345678912345678912"), function(){alert("ok");}, function(){alert("error");});
            }, function(){ myApp.alert("Errore durante la connessione al device."); disconnect(); });
}


function getStatus(){
    
    $("#search-ble-block").fadeOut('fast');
    $("#ble-devices").fadeOut('fast', function(){
            $("#connected-to").html('CONNESSO A '+dev.name+' '+dev.id);
            $("#connected-block").fadeIn('fast');
    });
    stz = {};
    ble.read(dev.id, stzService_uuid, lat_uuid, function(lat){ stz['lat'] = bytesToFloat(lat) }, function(){ myApp.alert("impossibile recuperare i dati sulla posizione dalla stazione."); disconnect(); }); 
    ble.read(dev.id, stzService_uuid, lon_uuid, function(lon){ stz['lon'] = bytesToFloat(lon) }, function(){ myApp.alert("impossibile recuperare i dati sulla posizione dalla stazione."); disconnect(); });
    linkClock();
    setTimeout(function(){myApp.alert(JSON.stringify(stz));},1000);
}

function linkClock(){

    ble.startNotification(dev.id, stzService_uuid, day_uuid, function(buf){ 
                                                                    var d = bytesToInt(buf);
                                                                    
                                                                    if(d < 10){ 
                                                                        day = "0"+d.toString();
                                                                    }else{
                                                                        day = d.toString();
                                                                    }
                                                                    $("#date-day").html(day);
                                                                    

                                                                });
    
    ble.startNotification(dev.id, stzService_uuid, month_uuid, function(buf){ 
                                                                    var m = bytesToInt(buf); 
                                                                    if(m < 10){ 
                                                                        month = "0"+m.toString();
                                                                    }else{
                                                                        month = m.toString();
                                                                    }
                                                                    $("#date-month").html(month);

                                                                });
    ble.startNotification(dev.id, stzService_uuid, year_uuid, function(buf){ 
                                                                    var y = bytesToInt(buf); 
                                                                    if(y < 10){ 
                                                                        year = "000"+y.toString();
                                                                    }else if(y >= 10 & y < 100){ 
                                                                        year = "00"+y.toString();
                                                                    }else if(y >= 100 & y < 1000){ 
                                                                        year = "0"+y.toString();
                                                                    }else{
                                                                        year = y.toString();
                                                                    }
                                                                    $("#date-year").html(year);

                                                                });
    ble.startNotification(dev.id, stzService_uuid, hour_uuid, function(buf){ 
                                                                    var h = bytesToInt(buf); 
                                                                    if(h < 10){ 
                                                                        hour = "0"+h.toString();
                                                                    }else{
                                                                        hour = h.toString();
                                                                    }
                                                                    $("#time-hour").html(hour);

                                                                });
    ble.startNotification(dev.id, stzService_uuid, minute_uuid, function(buf){ 
                                                                    var m = bytesToInt(buf); 
                                                                    if(m < 10){ 
                                                                        minute = "0"+m.toString();
                                                                    }else{
                                                                        minute = m.toString();
                                                                    }
                                                                    $("#time-minute").html(minute);

                                                                });
    ble.startNotification(dev.id, stzService_uuid, second_uuid, function(buf){ 
                                                                    var s = bytesToInt(buf); 
                                                                    if(s < 10){ 
                                                                        second = "0"+s.toString();
                                                                    }else{
                                                                        second = s.toString();
                                                                    }
                                                                    $("#time-second").html(second);

                                                                });
                                                                
    
}

function unlinkClock(){
    ble.stopNotification(dev.id, stzService_uuid, day_uuid);
    ble.stopNotification(dev.id, stzService_uuid, month_uuid);
    ble.stopNotification(dev.id, stzService_uuid, year_uuid);
    ble.stopNotification(dev.id, stzService_uuid, hour_uuid);
    ble.stopNotification(dev.id, stzService_uuid, minute_uuid);
    ble.stopNotification(dev.id, stzService_uuid, second_uuid);
}

function disconnect(){
    if(dev != null){
        unlinkClock();
        ble.disconnect(dev.id);
        $("#search-ble-block").fadeIn('fast');
        $("#ble-devices").fadeIn('fast');
        $("#connected-block").fadeOut('fast');
        dev = null;
        stz = null;

    }
}

// ASCII only
function stringToBytes(string) {
   var array = new Uint8Array(string.length);
   for (var i = 0, l = string.length; i < l; i++) {
       array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

function floatToBytes(f){
    var fb = new Float32Array(1);
    fb[0] = f;
    return fb.buffer;
}

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function bytesToFloat(buffer){
    var x = new Float32Array(buffer);
    return x[0];
}

function bytesToInt(buffer){
    var x = new Int32Array(buffer);
    return x[0];
}

$('#stazione').on('show', function(){

});
