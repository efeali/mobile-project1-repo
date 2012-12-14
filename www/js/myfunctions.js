function checkConnection()
{
	var networkState = navigator.connection.type;
	var states = {};
	states[Connection.UNKNOWN]  = 'Unknown connection';
	states[Connection.ETHERNET] = 'Ethernet connection';
	states[Connection.WIFI] = 'Wifi connection';
	states[Connection.CELL_2G] = 'Cell 2G connection';
	states[Connection.CELL_3G] = 'Cell 3G connection';
	states[Connection.CELL_4G] = 'Cell 4G connection';
	states[Connection.NONE] = 'No network connection';
	
	return ('Connection type : ' + states[networkState]);
}

function showDeviceName()
{
	$('#home div p').html(window.device.name);
}

$(document).delegate("#connection","pageinit", function(){
	$('#connection div[data-role=content]').html(checkConnection());
})

$(document).delegate("#myDevice","pageinit",function(){

	var content = "";
	content += 'Device Name : '+ device.name + '<br />';
	content += 'Device Cordova : ' + device.cordova + '<br />';
	content += 'Device Platform : ' + device.platform + '<br />';
	content += 'Device UUID : ' + device.platform + '<br />';
	content += 'Device Version : ' + device.version + '<br />';
	$('#deviceInfo').html(content);
	
})

var watchID, geoWatchID; // this will be used for compass
$(document).delegate("#navAndCompass", "pageinit", function(){
	watchID = navigator.compass.watchHeading(compSuccess, compError, { frequency :5000 });
	geoWatchID = navigator.geolocation.getCurrentPosition(navSuccess, navError, {timeout:30000});

})

window.addEventListener("batterystatus", showBatteryLevel, false);
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady(){
	
	
}
function compSuccess(heading)
{
	$('#compass').html('Heading :' + heading.magneticHeading);
}
function compError(compassError)
{
	alert('compass error : '+compassError.code);
}

function navSuccess(position)
{
	var content = "";
	content += 'Latitude: ' + position.coords.latitude + '<br />';
	content += 'Longitude: ' + position.coords.longitude +'<br />';
	content += 'Altitude: ' + position.coords.altitude +'<br />';
	content += 'Accuracy: ' + position.coords.accuracy +'<br />';
	content += 'Altitude accuracy: ' + position.coords.altitudeAccuracy +'<br />';
	content += 'Heading: ' + position.coords.heading +'<br />';
	content += 'Speed: ' + position.coords.speed +'<br />';
	$('#myNavigator').html(content);
}
function navError(error)
{
	$('#myNavigator').html('Code :' +error.code +'<br />Message : '+error.message);
}


function showBatteryLevel(info)
{
	var content = '';
	content += 'Current battery level : ' + info.level + '<br />';
	if(info.isPlugged == true)
		content += 'Device is plugged to power';
	else
		content += 'Device is not plugged to power';
	$('#batteryInfo').html(content);
}