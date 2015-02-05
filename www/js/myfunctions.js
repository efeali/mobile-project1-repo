var navOptions = {enableHighAccuracy:true, timeout:15000, maximumAge:180000};
var locationID ; // we will use this to store watchPosition s id so we can cancel it when we want.
var user;
var client = new XMLHttpRequest(); // prepare asynchronous request javascript client (ajax), this will be used to save a post (and upload an image)

///// define variables we will use for webSQL database
var localdb, localdbReady;
var localdbVersion = 1;
var localdbName = "webblog";
var localdbDisplayName = "webblog_db";
var localdbSize = 2*1024*1024;
/// end of db variables

var postTimer; // this will be used for storing interval timer id

var online = navigator.onLine; // navigator.onLine contains boolean value for if you have network connection or not

window.addEventListener('online', function(){ // when you become online
   online = true;
    alert('you are online');
});

window.addEventListener('offline', function(){ // when you become offline
    online = false;
    alert('you are offline');
});

window.addEventListener('load',function(){
    FastClick.attach(document.body); // this will attach and activate fastclick hack



    user = JSON.parse(sessionStorage.getItem('user')); // we have stored user object as text in session once we logged in, now when this page loading we are reading what was stored, and convert that to javascript object
    // this object already has id property

    if(user == null)
    {
        document.location.href = "index.html";
    }
    // create or maintain local database
    localdb = window.openDatabase(localdbName, localdbVersion, localdbDisplayName, localdbSize, function(){ createLocalTable();});
    // after database created we call createLocalTable() function to create tables if they are not exists


});

$('#home').on('pageshow',function(){

    getPosts();
    postTimer = setInterval(getPosts, 60000);
});

$('#addPost').on('pageshow',function(){
    locationID = navigator.geolocation.getCurrentPosition(watchLocation, locationError, navOptions);
    // start detecting our location when send post page loaded
});

$('#addPost').on('click',function(){
    $('#topMenu').collapsible("collapse");
});

$(document).on("pagebeforehide","#home",function(){ // When leaving pagetwo
    clearInterval(postTimer);
    $('#topMenu').collapsible("collapse");
});

$('#sendBtn').on('click', function(){ sendPost(); }); // in addpost page if we click send button we will // call sendPost function

$('.logoutBtn').on('click',function(){
    $('#topMenu').collapsible('collapse'); // closing menu

    $.get("http://vancouverwebschool.com/webblog/admin/handler.php",{logout:true}); // send rest request to server for logging out
   document.location.href = "index.html";
});

$(document).on("click",function(){
    $('#topMenu').collapsible("collapse");
});

////// LOCAL DATABASE
function createLocalTable()
{
    var sql1 = "CREATE TABLE IF NOT EXISTS photos (photoID int(10) DEFAULT NULL, filename varchar(100) DEFAULT NULL, postID int(10) DEFAULT NULL);";

    var sql2 = "CREATE TABLE IF NOT EXISTS posts (postID int(10) NOT NULL PRIMARY KEY, content text DEFAULT NULL, date timestamp NOT NULL, authorID int(10) NOT NULL, comments int(11) NOT NULL DEFAULT 0, locLatitude float DEFAULT NULL, locLongitude float DEFAULT NULL);";

    var sql3 = "CREATE TABLE IF NOT EXISTS users (userID int(10) NOT NULL PRIMARY KEY, userName varchar(50) NOT NULL);";

    localdb.transaction(function(tx){
        tx.executeSql(sql1);
        tx.executeSql(sql2);
        tx.executeSql(sql3);
    });
    localdbReady = true; // setting flag so when we get posts we will insert latest 20 into localdb
}
//////  end of createLocalTable()

function sendPost(){
    var content = $('#postContent').val(); // get post content
    var file = document.getElementById('postPhoto'); // get file element
    var formData = new FormData(); // prepare a new form

    formData.append('postContent', content); // append content into this new form
    formData.append('postAuthorID', user.id); // append user id into form
    formData.append('postLat', user.lat); // append element named postLat and put user's latitute value
    formData.append('postLong', user.long);

    if(file.files[0]) // if there is a photo
    {
        formData.append('postPhoto', file.files[0]);  // append photo file into form
    }

    client.upload.onprogress = function(progressEvent)
    {
        $('#loader').show();

        if(progressEvent.lengthComputable){
            var perc = Math.floor(progressEvent.loaded / progressEvent.total*100);
            $('#points').css('width', perc*0.9+"%");
            $('#points').html(perc+"% done");
        }
    };

    client.open("POST","http://vancouverwebschool.com/webblog/admin/handler.php?addPost", true); // open socket
    client.send(formData); // sending form to server
} // end of sendPost function

client.onreadystatechange= function()  // listening ajax communication state changes
{
    if(client.readyState == 4 && client.status == 200) // when there is a result for savePost (success)
    {
        $('#loader').hide();

        var data = JSON.parse(client.responseText); // receiving server's answer and convert to json object
        if(data.result == true) // if post saved successfully
        {
            alert(data.msg);
            $('#postContent').val('');
            $('#postPhoto').val('');
            $('#points').css('width','0'); // resetting progress bar

            $.mobile.changePage( "#home", { transition: "slideup", changeHash: false });
        }
        else // if saving post failed
        {
            alert(data.msg);
        }
    }

}




function watchLocation(position)
{
    user.lat = position.coords.latitude;
    user.long = position.coords.longitude;
}
function locationError(e)
{
    switch (e.code)
    {
        case 0: console.log('Something went wrong '+ e.message);
            break;
        case 1: console.log('You denied permission to retrieve a location');
            break;
        case 2: console.log('Browser was unable to retrieve your location');
            break;
        case 3: console.log('Browser timed out before retrieving the location');
            break;
    }
}



function getPosts(){

    if(online == true)
    {

        $.ajax({
            url:"http://vancouverwebschool.com/webblog/admin/handler.php",
            cache:false,
            data:{getPosts:true},
            dataType: "JSON",
            type:"GET",
            crossDomain:true,
            timeout:3000,
            success: function(records)
            {
                if(records.result == false)
                {
                    alert(records.msg);
                }
                else
                {
                    var content = "";
                    var counter = 0;

                    $('#home .ui-content').html(''); // remove all existing article elements from home page

                    $(records.data).each(function(index, row){
                        content += '<article class="ui-body ui-body-a ui-corner-all">';
                        content += '<h4>From: '+ row.userName+ ' <span class="articleDate">@ '+ row.date+'</span></h4>';
                        content += '<p>';
                        if(row.filename != null)
                        {
                            content += '<img src="http://vancouverwebschool.com/webblog/photos/'+row.filename+'" >';
                        }
                        content += row.content + '</p></article>';

                        /// store this post into local tables
                        if(localdbReady && counter <20)  // if there is a localdatabase and if counter is still less than 20
                        {
                            localdb.transaction(function(tx){
                               tx.executeSql("INSERT INTO posts (`postID`,`content`,`date`,`authorID`, `comments`, `locLatitude`, `locLongitude`) VALUES (?,?,?,?,?,?,?)", [row.postID, row.content, row.date, row.authorID, row.comments,row.locLatitude, row.locLongitude]);
                            });

                            localdb.transaction(function(tx){
                                tx.executeSql("INSERT INTO photos (`photoID`, `filename`, `postID`) VALUES (?,?,?)", [row.photoID, row.filename, row.photoPostID]);

                            });

                            localdb.transaction(function(tx){
                                tx.executeSql("INSERT INTO users (`userID`,`userName`) VALUES (?,?)", [row.userID, row.userName]);
                            });
                            counter++;
                        } // ends if condition

                    }); // end of each loop
                    $('#home .ui-content').html(content);
                }
            }
        })
    }// if ended here
    else // if there is no internet connection
    {

        // get posts from local database

    }
}