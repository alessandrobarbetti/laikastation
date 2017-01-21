// Initialize app
var myApp = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var imuService_uuid = "da721f52-d970-11e6-bf26-cec0c932ce01";
var ax_uuid = "f321fb70-d971-11e6-bf26-cec0c932ce01";
var ay_uuid = "f321fdb4-d971-11e6-bf26-cec0c932ce01";
var az_uuid = "f321feae-d971-11e6-bf26-cec0c932ce01";
var dev_id =  "";

var deviceName = "LaikaStation";

var ax = 0;
var ay = 0;
var az = 0;

console.log("abc");

var onAx = function(buffer) {
    var ax_val = bytesToFloat(buffer);
    $$("#ax_val").html(ax_val);
}

var onAy = function(buffer) {
    var ay_val = bytesToFloat(buffer);
    $$("#ay_val").html(ay_val);
}

var onAz = function(buffer) {
    var az_val = bytesToFloat(buffer);
    $$("#az_val").html(az_val);
}

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    //alert("Device is ready!");
    //ble.isEnabled(function() {alert("Bluetooth is enabled");},function() {alert("Bluetooth is *not* enabled");});
    
    var devices = [];
    var millisScan = 5000;

    ble.startScan([], function(device) { devices.push(device); }, function(){});
    
    setTimeout(ble.stopScan, millisScan,
        function() { listDevices(devices); },
        function() { console.log("stopScan failed"); }
    );

});

function listDevices(devices){
    
    for(var i = 0; i < devices.length; i++){        
        if(i == 0){
            dev_id = devices[i].id;
            ble.connect(dev_id, function(){
                //ble.read(dev_id, imuService_uuid, ay_uuid, function(buf){ alert(bytesToFloat(buf)); }, function(){ alert("failure"); });
                ble.startNotification(dev_id, imuService_uuid, ax_uuid, onAx, function(){alert("error ax");});
                ble.startNotification(dev_id, imuService_uuid, ay_uuid, onAy, function(){alert("error ay");});
                ble.startNotification(dev_id, imuService_uuid, az_uuid, onAz, function(){alert("error az");});
                //var tx_buffer = stringToBytes("12345678912345678912");
                //ble.writeWithoutResponse(dev_id, uart_service, tx, stringToBytes("12345678912345678912"), function(){alert("ok");}, function(){alert("error");});
            }, function(){ alert("Disconnected"); });
        }
    }
}

function disconnect(){
    ble.stopNotification(dev_id, imuService_uuid, ax_uuid);
    ble.stopNotification(dev_id, imuService_uuid, ay_uuid);
    ble.stopNotification(dev_id, imuService_uuid, az_uuid);
    ble.disconnect(dev_id);
}

// ASCII only
function stringToBytes(string) {
   var array = new Uint8Array(string.length);
   for (var i = 0, l = string.length; i < l; i++) {
       array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

function bytesToFloat(buffer){
    var x = new Float32Array(buffer, 0, buffer.length);
    return x[0];
}

// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):
myApp.onPageInit('about', function (page) {
    // Do something here for "about" page

})

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        myApp.alert('Here comes About page');
    }
})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="about"]', function (e) {
    // Following code will be executed for page with data-page attribute equal to "about"
    myApp.alert('Here comes About page');
})