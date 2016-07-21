'use strict';  // jshint ignore:line
var debug = true;

// ------------------------------------------------------------------------------------------------------------------------ //
//  Pebble Functions
// ------------------------------------------------------------------------------------------------------------------------ //
Pebble.addEventListener("ready", function(e) {
  console.log("PebbleKit JS Has Started!");
});


// Any message from the pebble C app will start the login process
Pebble.addEventListener("appmessage", function(e) {
  //log_in_via_ptc("pokemon trainers club username", "password");
  log_in_via_google("gmail_username", "gmail_password");  // no @gmail.com needed for username
});





// ------------------------------------------------------------------------------------------------------------------------ //
//  Helper Functions
// ------------------------------------------------------------------------------------------------------------------------ //
var xhrRequest = function (url, type, params, header, success, error) {
  if(debug) console.log("Sending request to: "+url);
  var request = new XMLHttpRequest();
  request.onload = function() {
    if (this.readyState == 4 && this.status == 200) {
      if(debug) console.log("Success: " + this.responseText);
      success(this.responseText);
    } else {
      console.log("XHR Error: " + this.responseText);
      error(this.responseText);
    }
  };

  var paramsString = "";
  if (params !== null) {
    for (var i = 0; i < params.length; i++) {
      paramsString += params[i];
      if (i < params.length - 1) {
        paramsString += "&";
      }
    }
  }

  if (type == 'GET' && paramsString !== "") {
    url += "?" + paramsString;
  }

  request.open(type, url, true);

  if (header !== null) {
    if(debug) console.log("Header found: "+ header[0] + " : "+ header[1]);
    request.setRequestHeader(header[0], header[1]);
  }

  if (type == 'POST') {
    request.send(paramsString);
  } else {
    request.send();
  }
};




function parseKeyValues(body) {
    var obj = {};
    body.split("\n").forEach(function (line) {
        var pos = line.indexOf("=");
        if (pos > 0) obj[line.substr(0, pos)] = line.substr(pos + 1);
    });
    return obj;
}



// ------------------------------------------------------------------------------------------------------------------------ //
//  Google OAuth Functions
// ------------------------------------------------------------------------------------------------------------------------ //
var AUTH_URL = 'https://android.clients.google.com/auth';
var oauth_service = 'audience:server:client_id:848232511240-7so421jotr2609rmqakceuu1luuq0ptb.apps.googleusercontent.com';
var app = 'com.nianticlabs.pokemongo';
var client_sig = '321187995bc7cdc2b5fc91b11a96e2baa8602c62';
var android_id = '9774d56d682e549c';

function google_oauth (email, master_token, android_id, service, app, client_sig, callback) {
    var params = [
        "accountType=HOSTED_OR_GOOGLE",
        "Email=" + email,
        "EncryptedPasswd=" + master_token,
        "has_permission=1",
        "service=" + service,
        "source: android",
        "androidId=" + android_id,
        "app=" + app,
        "client_sig=" + client_sig,
        "device_country=us",
        "operatorCountry=us",
        "lang=en",
        "sdk_version=17"
    ];
  var header = ["Content-type", "application/x-www-form-urlencoded"];
  xhrRequest(AUTH_URL, "POST", params, header,
             function(responseText) {
               if(debug) console.log("Success! Response:\n" + responseText);
               var key_values = parseKeyValues(responseText);
               if(debug) console.log("key_values stringified: " + JSON.stringify(key_values));
               if(key_values.Auth) {
                 callback(null, key_values.Auth);
               } else {
                console.log("error: No Auth");
                //callback("error", "No Auth");
                callback("error", responseText);
               }
             },
             function(responseText) {
               console.log("error in google_oauth: " + responseText);
               callback("error", responseText);
             }
            );
}


function google_login(email, password, android_id, callback) {
    var params = [
        "accountType=HOSTED_OR_GOOGLE",
        "Email="+ email.trim(),
        "has_permission=1",
        "add_account=1",
        "Passwd="+password,
        "service=ac2dm",
        "source=android",
        "androidId=" + android_id,
        "device_country=us",
        "operatorCountry=us",
        "lang=en",
        "sdk_version=17"
    ];
  var header = ["Content-type", "application/x-www-form-urlencoded"];
  xhrRequest(AUTH_URL, "POST", params, header,
             function(responseText) {
               if(debug) console.log("Success!  Response:\n" + responseText);
               var key_values = parseKeyValues(responseText);
               if(key_values.Token) {
                 if(debug) console.log("success getting Token: " + key_values.Token);
                 google_oauth(email, key_values.Token, android_id, oauth_service, app, client_sig, callback);
               } else {
                 console.log("error: No Token");
                 //callback("error", "No Token");
                 callback("error", responseText);
               }
             },
             function(responseText) {
               console.log("error in google_login: " + responseText);
               callback("error", responseText);
             }
            );
}


function log_in_via_google(user, pass) {
  console.log("Getting Google Access Token...");
  google_login(user, pass, android_id, function (err, data) {
    if (err) {
      console.log("error: " + data);
    } else {
      console.log("Successfully received Google Access Token!");
      var token = data;
      console.log("Auth = " + token);
      // Insert Next Step here: GetApiEndpoint(token)
    }
  });
}


// ------------------------------------------------------------------------------------------------------------------------ //
//  PTC Login Functions
//    Current doesn't work since cookies aren't saved.
//    For more info: https://github.com/pebble/pebblejs/issues/76
// ------------------------------------------------------------------------------------------------------------------------ //
var API_URL     = 'https://pgorelease.nianticlabs.com/plfe/rpc';
var LOGIN_URL     = 'https://sso.pokemon.com/sso/login?service=https%3A%2F%2Fsso.pokemon.com%2Fsso%2Foauth2.0%2FcallbackAuthorize';
var LOGIN_OAUTH = 'https://sso.pokemon.com/sso/oauth2.0/accessToken';

function log_in_via_ptc(username, password) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange=function() {
    console.log("xhr readystate: " + xhr.readyState + " status: " + xhr.status);
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log("xhr response text = " + xhr.responseText);
      var jdata = JSON.parse(xhr.responseText);
      console.log("jdata = " + JSON.stringify(jdata));
      
      var xhr2 = new XMLHttpRequest();
      xhr2.onreadystatechange=function() {
        console.log("xhr2 readystate: " + xhr2.readyState + " status: " + xhr2.status);
        if (xhr2.readyState == 4 && xhr2.status == 200) {
          console.log("xhr2 response text = " + xhr2.responseText);
        } else {
          try {
            console.log("xhr2 allofit: " + JSON.stringify(xhr2));
            console.log("All Response Headers = " + xhr2.getAllResponseHeaders());
            console.log("response url = " + xhr2.responseURL);
            console.log("response header = " + xhr2.getResponseHeader('Location'));
          } catch (e) {}
        }
      };
      
      var thedata = 'lt=' + jdata.lt + "&execution=" + jdata.execution + "&_eventId=submit&username=" + username + "&password=" + password;
      console.log("Going to URL: " + LOGIN_URL + "?" + thedata);
      xhr2.open("POST", LOGIN_URL, true);
      xhr2.send(thedata);
      
      //var DIRECT_URL = 'https://sso.pokemon.com/sso/login?service=https%3A%2F%2Fsso.pokemon.com%2Fsso%2Foauth2.0%2FcallbackAuthorize&lt=' + jdata.lt + "&execution=" + jdata.execution + "&_eventId=submit&username=" + username + "&password=" + password;
      //console.log("Going to URL: " + DIRECT_URL);
      //xhr2.open("POST", DIRECT_URL, true);
      //xhr2.send();
    }
  };
  
  xhr.open("GET", LOGIN_URL, true);
  //xhr.setRequestHeader('User-Agent','niantic');  // <-- Fails
  xhr.send();
}
