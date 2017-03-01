
 
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
var stato_monit_uuid = "33ade16a-fda6-11e6-bc64-92361f002671";
var isLaika_uuid = "9e6850ba-d972-11e6-bf26-cec0c932ce01";

var day_uuid = "d02d0988-edd6-11e6-bc64-92361f002671";
var month_uuid = "d02d0f46-edd6-11e6-bc64-92361f002671";
var year_uuid = "d02d1130-edd6-11e6-bc64-92361f002671";
var hour_uuid = "d02d12de-edd6-11e6-bc64-92361f002671";
var minute_uuid = "d02d14e6-edd6-11e6-bc64-92361f002671";
var second_uuid = "d02d1694-edd6-11e6-bc64-92361f002671";

var dateSet_uuid = "c93a1b94-fcd5-11e6-bc64-92361f002671";
var timeSet_uuid = "c93a1df6-fcd5-11e6-bc64-92361f002671";

var day = "01";
var month = "01";
var year = "2017";
var hour = "00";
var minute = "00";
var second = "00";

var dev = null;

var devices = [];
var millisScan = 5000;

var stz = null;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

$$('#search-ble-block').on('click', function(){
    startDeviceScan();
});

$$('#disconnect-block').on('click', function(){
    disconnect();
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    ble.isEnabled(function() { startDeviceScan(); },
        function() { 
            myApp.alert("Abilitare il Bluetooth per collegarsi alla Stazione Laika");
        });
});


$$(document).on('resume', function() {
    if(dev != null){
        ble.isConnected(dev.id, function(){ getStatus() }, function(){
           myApp.alert("Abilitare il Bluetooth per collegarsi alla Stazione Laika");
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

    $$('#ble-devices ul').html("");
    if(devices.length > 0){   
        for(var i = 0; i < devices.length; i++){
            var el = '<li class="item-content" id="ble-device'+i+'"><div class="item-inner"><div class="item-title">'+devices[i].name+'</div><div class="item-after">'+devices[i].id+'</div></div></li>';
            $$('#ble-devices ul').append(el);
            $$('#ble-device'+i).click(create_connect_callback(i));
        }
    }else{
        $$('#ble-devices ul').html('<li class="item-content"><div class="item-inner"><div class="item-title">Nessun device trovato.</div></li>');
    }

    $('#ble-devices').fadeIn('fast');
}

function connectToDevice(i){
    dev = devices[i];
    ble.connect(dev.id, function(){
                ble.read(dev.id, stzService_uuid, isLaika_uuid, function(s){ var k = bytesToInt(s); if(k != 1){ disconnect(); myApp.alert("Periferica non riconosciuta."); }else{ getStatus(); } }, function(){ myApp.alert("Errore durante la connessione al device."); disconnect(); });
            }, function(){ myApp.alert("Errore durante la connessione al device."); disconnect(); });
}

function create_connect_callback(j){
    return function(){connectToDevice(j);}
}

function getStatus(){
    
    $("#search-ble-block").fadeOut('fast');
    $("#ble-devices").fadeOut('fast', function(){
            $("#connected-to").html('CONNESSO A '+dev.name+' '+dev.id);
            $("#connected-block").fadeIn('fast');
    });
    stz = {};

    readLat();
    readLon();
    readStatoMonit();
    readEsp();
    
    $$('#btn-stz').removeClass('disabled');
    $$('#btn-imp').removeClass('disabled');
    $$('#btn-avz').removeClass('disabled');
    
    linkStz();
    linkClock();
    setTimeout(function(){},1000);
}

function linkStz(){
    ble.startNotification(dev.id, stzService_uuid, stato_monit_uuid, function(buf){ 
                                                                    stz['stato-monitoraggio'] = bytesToInt(buf);                                                                
                                                                    
                                                                    if(stz['stato-monitoraggio'] == 1){
                                                                        $$('#input-monitoraggio').prop('checked', true);
                                                                    }else{
                                                                        $$('#input-monitoraggio').prop('checked', false);
                                                                    }
                                                                });

    ble.startNotification(dev.id, stzService_uuid, lat_uuid, function(buf){ 
                                                                    stz['lat'] = bytesToFloat(buf);
                                                                    $$("#lat-val").html(stz['lat']);
                                                                });

    ble.startNotification(dev.id, stzService_uuid, lon_uuid, function(buf){ 
                                                                    stz['lon'] = bytesToFloat(buf);
                                                                    $$("#lon-val").html(stz['lon']);
                                                                });
    ble.startNotification(dev.id, stzService_uuid, tempo_monit_uuid, function(buf){ 
                                                                    stz['esp'] = bytesToFloat(buf);
                                                                    $$("#esp-val").html(stz['esp']);
                                                                });
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

function unlinkStz(){
    ble.stopNotification(dev.id, stzService_uuid, stato_monit_uuid);
    ble.stopNotification(dev.id, stzService_uuid, lat_uuid);
    ble.stopNotification(dev.id, stzService_uuid, lon_uuid);
    ble.stopNotification(dev.id, stzService_uuid, tempo_monit_uuid);
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
        unlinkStz();
        unlinkClock();
        ble.disconnect(dev.id);
        $("#search-ble-block").fadeIn('fast');
        $("#ble-devices").fadeIn('fast');
        $("#connected-block").fadeOut('fast');
        dev = null;
        stz = null;
        $$('#btn-stz').addClass('disabled');
        $$('#btn-imp').addClass('disabled');
        $$('#btn-avz').addClass('disabled');
    }
    myApp.showTab('#ble');
}

function readLat(){
   ble.read(dev.id, stzService_uuid, lat_uuid, function(buf){ 
                                                                stz['lat'] = bytesToFloat(buf).toFixed(4);                                                            
                                                                $$("#lat-val").html(stz['lat']);
                                                            }, function(){ });
}

function readLon(){
    ble.read(dev.id, stzService_uuid, lon_uuid, function(buf){ 
                                                                stz['lon'] = bytesToFloat(buf).toFixed(4);                                                                
                                                                $$("#lon-val").html(stz['lon']);
                                                            }, function(){ });
}

function readEsp(){
    ble.read(dev.id, stzService_uuid, tempo_monit_uuid, function(buf){ 
                                                                stz['esp'] = bytesToInt(buf);
                                                                $$("#esp-val").html(stz['esp']);
                                                            }, function(){ });
}

function readStatoMonit(){
    ble.read(dev.id, stzService_uuid, stato_monit_uuid, function(buf){ 
                                                                    stz['stato-monitoraggio'] = bytesToInt(buf);                                                                
                                                                    
                                                                    if(stz['stato-monitoraggio'] == 1){
                                                                        $$('#input-monitoraggio').prop('checked', true);
                                                                    }else{
                                                                        $$('#input-monitoraggio').prop('checked', false);
                                                                    }
                                                                }, function(){ });
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

function intToBytes(i){
    var x = new Int32Array(1);
    x[0] = i;
    return x.buffer;
}

$$('#mod-data').on('click', function () {
    myApp.modal({
        title:  'Modifica data:',
        text: '<input id="new-date-input" type="date" value="'+year+'-'+month+'-'+day+'">',
        onClick: function(m,i){
            if(i == 0){
                var d = new Date($$(m).find("#new-date-input")[0].value);
                if(isNaN(d)){
                    myApp.alert("Data inserita non valida");
                }else{
                    ble.write(dev.id, stzService_uuid, dateSet_uuid, intToBytes(1),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, day_uuid, intToBytes(d.getDate()),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, month_uuid, intToBytes(d.getMonth()+1),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, year_uuid, intToBytes(d.getFullYear()),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, dateSet_uuid, intToBytes(0),function(){ }, function(){ });
                }
            }else if(i == 1){
                var d = new Date();
                d.setTime( d.getTime() + 60*1000 );
                ble.write(dev.id, stzService_uuid, dateSet_uuid, intToBytes(1),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, day_uuid, intToBytes(d.getDate()),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, month_uuid, intToBytes(d.getMonth()+1),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, year_uuid, intToBytes(d.getFullYear()),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, dateSet_uuid, intToBytes(0),function(){ }, function(){ });
            }
        },
        buttons: [
            {
                text: 'Imposta'
            },
             {
                text: 'Da Tel.'
            },
            {
                text: 'Annulla'
            },
        ]
    })
});

$$('#mod-ora').on('click', function () {
    myApp.modal({
        title:  'Modifica ora:',
        text: '<input id="new-ora-input" type="time" step="1" value="'+hour+':'+minute+':'+second+'">',
        onClick: function(m,i){
            if(i == 0){
                var input = $$(m).find("#new-ora-input")[0].value.split(':');
                if(input.length != 3 && input.length != 2){
                    myApp.alert("Ora inserita non valida");
                }else{
                    if(input.length == 2){
                        input[2] = 0;
                    }
                    ble.write(dev.id, stzService_uuid, timeSet_uuid, intToBytes(1),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, hour_uuid, intToBytes(input[0]),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, minute_uuid, intToBytes(input[1]),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, second_uuid, intToBytes(input[2]),function(){ }, function(){ });
                    ble.write(dev.id, stzService_uuid, timeSet_uuid, intToBytes(0),function(){ }, function(){ });
                }
            }else if(i == 1){
                
                var d = new Date();
                d.setTime( d.getTime() + 60*1000 );

                ble.write(dev.id, stzService_uuid, timeSet_uuid, intToBytes(1),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, hour_uuid, intToBytes(d.getHours()),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, minute_uuid, intToBytes(d.getMinutes()),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, second_uuid, intToBytes(d.getSeconds()),function(){ }, function(){ });
                ble.write(dev.id, stzService_uuid, timeSet_uuid, intToBytes(0),function(){ }, function(){ });
                
            }
        },
        buttons: [
            {
                text: 'Imposta'
            },
            {
                text: 'Da Tel.'
            },
            {
                text: 'Annulla'
            },
        ]
    })
});

$$('#mod-lat').on('click', function () {
    myApp.modal({
        title:  'Modifica latitudine:',
        text: '<input id="new-lat-input" type="number" min="-90" max="90" step="0.0001" value="'+stz['lat']+'">',
        onClick: function(m,i){
            if(i == 0){
                var input = $$(m).find("#new-lat-input")[0].value;
                if(isNaN(parseFloat(input)) || input < -90 || input > 90 ){
                    myApp.alert("Latitudine inserita non valida");
                }else{
                    input = parseFloat(input).toFixed(4);
                    ble.write(dev.id, stzService_uuid, lat_uuid, floatToBytes(input),function(){ }, function(){ });
                    readLat();
                }
            }else if(i == 1){
                navigator.geolocation.getCurrentPosition(function(position){ 
                    var input = parseFloat(position.coords.latitude).toFixed(4);
                    ble.write(dev.id, stzService_uuid, lat_uuid, floatToBytes(input),function(){ }, function(){ });
                    readLat();
                });
            }
        },
        buttons: [
            {
                text: 'Imposta'
            },
            {
                text: 'Da Gps'
            },
            {
                text: 'Annulla'
            },
        ]
    })
});

$$('#mod-lon').on('click', function () {
    myApp.modal({
        title:  'Modifica longitudine:',
        text: '<input id="new-lon-input" type="number" min="-180" max="180" step="0.0001" value="'+stz['lon']+'">',
        onClick: function(m,i){
            if(i == 0){
                var input = $$(m).find("#new-lon-input")[0].value;
                if(isNaN(parseFloat(input)) || input < -180 || input > 180 ){
                    myApp.alert("Longitudine inserita non valida");
                }else{
                    input = parseFloat(input).toFixed(4);
                    ble.write(dev.id, stzService_uuid, lon_uuid, floatToBytes(input),function(){ }, function(){ });
                    readLon();
                }
            }else if(i == 1){
                navigator.geolocation.getCurrentPosition(function(position){ 
                    var input = parseFloat(position.coords.longitude).toFixed(4);
                    ble.write(dev.id, stzService_uuid, lon_uuid, floatToBytes(input),function(){ }, function(){ });
                    readLon();
                });
                
            }
        },
        buttons: [
            {
                text: 'Imposta'
            },
            {
                text: 'Da Gps'
            },
            {
                text: 'Annulla'
            },
        ]
    })
});

$$('#mod-esp').on('click', function () {
    myApp.modal({
        title:  'Modifica Minuti Esposizione:',
        text: '<input id="new-esp-input" type="number" min="0" max="9999999" step="1" value="'+stz['esp']+'">',
        onClick: function(m,i){
            if(i == 0){
                var input = $$(m).find("#new-esp-input")[0].value;
                if(isNaN(parseInt(input)) || input < 0){
                    myApp.alert("Tempo di esposizione inserito non valido.");
                }else{
                    input = parseInt(input);
                    ble.write(dev.id, stzService_uuid, tempo_monit_uuid, intToBytes(input),function(){ }, function(){ });
                    readEsp();
                }
            }
        },
        buttons: [
            {
                text: 'Imposta'
            },
            {
                text: 'Annulla'
            },
        ]
    })
});

$$('#input-monitoraggio').on('change', function(){

    if(this.checked){
        ble.write(dev.id, stzService_uuid, stato_monit_uuid, intToBytes(1),function(){ }, function(){ });
        readStatoMonit();
    }else{
        ble.write(dev.id, stzService_uuid, stato_monit_uuid, intToBytes(0),function(){ }, function(){ });
        readStatoMonit();
    }

})

$$('#stazione').on('show', function(){

});

$$('#impostazioni').on('show', function(){
    //$("#settings-date-time-input").value = $("#date-year").html()+"/"+$("#date-month").html()+"/"+$("#date-day").html()+"T"+$("#time-hour").html()+":"+$("#time-minute").html()+":"+$("#time-second").html();
});
