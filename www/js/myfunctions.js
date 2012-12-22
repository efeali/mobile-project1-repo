var states = {}; // for connection state
var watchID, geoWatchID, serverUpdateTimer, imageURI; // this will be used for compass
var myPosition;
var userID = 1;


function checkConnection()
{
	var networkState = navigator.connection.type;
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

$(document).delegate("#navAndCompass", "pageinit", function(){
	watchID = navigator.compass.watchHeading(compSuccess, compError, { frequency :5000 });
	geoWatchID = navigator.geolocation.watchPosition(navSuccess, navError, {timeout:30000, maximumAge:30000, enableHighAccuracy:true});
	

})

$(document).delegate("#cameraPage", "pageinit", function(){
	$('#imageStatus').css('display','none');
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
	$('#compass').html('compass error : '+compassError.code);
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
	myPosition = position;
	
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

function updateServer(obj)
{
	var pos = new Array();
	navigator.geolocation.getCurrentPosition(navSuccess, navError, {timeout:30000, maximumAge:30000, enableHighAccuracy:true});
	$('#updateStopButton').css('display','block');
	$('#updateStartButton').css('display','none');
	$('#serverUpdateStatus').html('Server update is active').css('color','#C00');
	pos = myPosition.coords;
	$.ajax({
		type:"POST",
		cache:false,
		timeout:3000,
		url:"http://theiamzone.com/ali_efe/mobile-app/api-port.php",
		data:{navUp:1,position:pos, uid:userID, dev:device.name}
	})
	serverUpdateTimer = setTimeout(updateServer,120000);
	
}
function stopServer()
{
		clearTimeout(serverUpdateTimer);
		$('#updateStopButton').css('display','none');
		$('#updateStartButton').css('display','block');
		$('#serverUpdateStatus').html('Server update stopped').css('color','#069');
}

function saveContact()
{
	var details = { 
		"FirstName" : document.getElementById('contactName').value,
		"LastName" : document.getElementById('contactLName').value,
		"FullName" : document.getElementById('contactName').value + " " + document.getElementById('contactLName').value,
		"EmailAddress" : document.getElementById('contactEmail').value,
		"MobilePhone" : document.getElementById('contactPhone').value	
	}
	
	var contact = navigator.contacts.create();
	contact.displayName = details.FullName;
	
	var tmpName = new ContactName();
	tmpName.givenName = details.FirstName;
	tmpName.familyName = details.LastName;
	tmpName.formatted = details.FullName;
	contact.name = tmpName;
	
	var phoneNums = [1];
	phoneNums[0] = new ContactField('mobile', details.MobilePhone, true);
	contact.phoneNumbers = phoneNums;
	
	var emailAddresses = [1];
	emailAddresses[0] = new ContactField('home', details.EmailAddress, true);
	contact.emails = emailAddresses;
	
	contact.save(function(){alert('New contact was saved'); $.mobile.changepage("#home",{ transition:"slideup"}); }, function(){alert('Contact couldn\'t saved');});
}

function searchContact()
{
	var name = document.getElementById('contactNameSearch').value;
	var opts = new ContactFindOptions();
	opts.filter = name;
	opts.multiple = true;
	var fields = ["name","phoneNumbers"];
	$('#contactsList').empty();
	$('#contactsList').css('display','none');
	navigator.contacts.find(fields, contactFindSuccess, function(){alert('Contact search error');}, opts);
}
function contactFindSuccess(contacts)
{
	var numContacts = contacts.length;
	if(numContacts > 0)
	{

		//console.log(contacts);
		var content = "";
		
		var theList = '<ul data-role="collapsible">';
		for(var i =0; i<numContacts; i++)
		{
			theList += '<li><a href="#" data-role="button">'+contacts[i].name.givenName;
			if(contacts[i].name.familyName != null)
				theList +=' '+contacts[i].name.familyName;
			theList +='</a>';
			theList += '<ul data-role="listview"><li>'+contacts[i].name.givenName;
			if(contacts[i].name.familyName != null)
			{
				theList += ' ' + contacts[i].name.familyName;
			}
			theList +='</li>';
			if(contacts[i].phoneNumbers.length>0)
			{
				for(var x=0; x<contacts[i].phoneNumbers.length; x++)
				{
					theList +='<li>'+contacts[i].phoneNumbers[x].value+' <span style="font-style:italic">('+contacts[i].phoneNumbers[x].type+')</span></li>';
				}
			}
			theList +='</ul>';
			theList += '</li>';
		}
		theList += '</ul>';
		$('#contactsList').html(theList).css('display','block');
		
		$('#contactsList li a').click(function(){
			$(this).parent('li').children('ul').toggle();
		});
		contacts = "";
		
	}
	else
	{
		alert('No contact found');
	}
	document.getElementById('contactNameSearch').value = "";
}

function takePicture()
{
	if(navigator.camera != null)
	{
		navigator.device.capture.captureImage(pictureSuccess, pictureError);
	}
	else
	{
		alert('Camera is not supported');
	}
}
function pictureError(message)
{
	if(message.code != 3)
	{
		$('#imageStatus').html('Failed because: '+message.code).css('display','block');
	}
}
function pictureSuccess(data)
{
	imageURI = data[0];
	$('#imageStatus').html('Image taken').css('display','block');
	$('#pictureUploadBtn').css('display','block');
	
}

 // alert dialog dismissed
function alertDismissed() {
        // do something
    }


function uploadPicToServer()
{
	$('#imageStatus').html('Sending image').css('color','#F90');
	
	var opts = new FileUploadOptions();
	opts.fileKey = "file";
	opts.fileName = device.name;
	opts.mimeType = "image/jpeg";
	
	var ft = new FileTransfer();
	ft.upload(imageURI.fullPath, encodeURI("http://theiamzone.com/ali_efe/mobile-app/api-port.php"), picUploadSuccess, picUploadFail, opts);
	
	navigator.camera.cleanup();
	$('#pictureUploadBtn').css('display','none');
	
}
function picUploadSuccess(r)
{
	console.log("Code = "+r.responseCode);
	console.log("Response = " + r.response);
	console.log("Sent = " + r.bytesSent);
	if(r.response == 1)
	{
		$('#imageStatus').html('Image uploaded').css('color','#393');
	}
	else if(r.response == 0)
	{
		$('#imageStatus').html('File uploaded but couldn\'t saved on server').css('color','red');
	}
	else
	{
		$('#imageStatus').html('File couldn\'t uploaded').css('color','red');
	}
}
function picUploadFail(error)
{
	$('#imageStatus').html('something went wrong').css('color','#C60');
}