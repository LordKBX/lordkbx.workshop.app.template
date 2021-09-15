//applicationDirectory
document.addEventListener('deviceready', onDeviceReady, false);
var socket = null;
var nbFiles = 0;
var loadedFiles = 0;
var appMode = 'debug';
var debugHost = '';

function clone(obj) {
	if (null === obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for(var attr in obj){ if(obj.hasOwnProperty(attr)){copy[attr] = obj[attr];} }
	return copy;
}

function listDir(path, callback){
	window.resolveLocalFileSystemURL(path,
	  function (fileSystem) {
		var reader = fileSystem.createReader();
		reader.readEntries(
		  function (entries) {
			console.log(entries);
			var i;
			tab = [];
		    for (i=0; i<entries.length; i++) {
		    	tab.push(entries[i].name);
		        console.log(entries[i].name);
		    }
		  	callback(tab);
		  },
		  function (err) {
		  	callback(false);
			console.error('listDir error 2', err);
		  }
		);
	  }, function (err) {
		callback(false);
		console.error('listDir error 1', err);
	  }
	);
  }

function readFile(fileEntry, callback) {
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function() {
            // console.log("Successful file read: " + this.result);
            // console.log(fileEntry.fullPath + ": " + this.result);
			if(callback !== undefined){
				callback(this.result);
				}
        };
        reader.readAsText(file);
    }, function(e){ console.log("Failed file read: " + e.toString()); });
}

function writeFile(fileEntry, dataObj, callback) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {

        fileWriter.onwriteend = function() {
            console.log("Successful file write...");
            //readFile(fileEntry);
        };

        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
        };

        // If data object is not passed in,
        // create a new Blob instead.
        if (!dataObj) {
            dataObj = new Blob(['some file data'], { type: 'text/plain' });
        }

        fileWriter.write(dataObj);
		
		if(callback !== undefined){ callback(); }
    });
}

function onErrorFunc(evt){ console.error(evt); }

function dbgPath(path){
	if(path[0] == '/'){ path = path.replace('/', ''); }
	if(appMode == 'debug'){ return path.replace(new RegExp('/', 'g'), '__'); }
	else{ return path; }
}

function ReadDataFile(path, callback){
	window.resolveLocalFileSystemURI(cordova.file.dataDirectory+path, function (fileEntry) {
		readFile(fileEntry, callback);
	}, 
	function(error){  console.error(error); });
}

function DirectReadDataFile(path, callback){
	window.resolveLocalFileSystemURI(path, function (fileEntry) {
		readFile(fileEntry, callback);
	}, 
	function(error){  console.error(error); });
}

function WriteDataFile(path, data, callback){
	path = path.replace('/', '');
	tpath = path.split('/');
	lpath = '';
	if(tpath.length > 1){ for(i=0; i<tpath.length-1; i++){ lpath = tpath[i] + '/'; } }

	window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dirEntry) {
		subWriteDataFile(cordova.file.dataDirectory, cordova.file.dataDirectory+path,  data, dirEntry, callback);
	}, 
	function(error){  console.error(error); });
}

function subWriteDataFile(path, endPath, data, dirEntry, callback) {
	tpath = endPath.replace(path, '').replace(new RegExp('/', 'g'), '__');
	dirEntry.getFile(tpath, { create: true, exclusive: false }, function (fileEntry) {
		writeFile(fileEntry, data, callback);
	}, function(error){ console.error(error); });
}

function onDeviceReady() {
	// Cordova is now initialized. Have fun!
	
	window.resolveLocalFileSystemURL(cordova.file.applicationDirectory+'www/', function (dirEntry) {
		console.log('file system open: ' + dirEntry.name);
		dirEntry.getFile("mode.txt", { create: false, exclusive: false }, function (fileEntry) {
			readFile(fileEntry, function(ret){
				if(ret.indexOf('debug') === 0){
					appMode = 'debug';
					rt = ret.split(':');
					port = 8345;
					host = rt[1].trim();
					debugHost = host;
					console.log(host, port);
					socket = new WebSocket("ws://"+host+':'+port);
					socket.onopen = function(e) {
					  console.log("Connection established");
					};

					socket.onmessage = function(event) {
					  console.log(`[message] Data received from server:`, event.data.substring(0, 100)+((event.data.length>100)?'...':''));
					  if(event.data == 'READY'){
						  socket.send("List");
						  }
					  else if(event.data.indexOf('List:') === 0){
							try{
								data = JSON.parse(event.data.replace('List:', ''));
								nbFiles = data.length;
								for(i=0; i<data.length; i++){
									socket.send("Load:"+data[i]);
								}
							}
						  catch(error){}						  
						  }
					  else if(event.data.indexOf('Load:') === 0){
						  tdata = event.data.split(':');
						  console.log(tdata);
						  WriteDataFile(tdata[1], Base64.decode(tdata[2]), function(ret){
							loadedFiles = loadedFiles + 1;
							console.log('File loaded '+loadedFiles+'/'+nbFiles);
							if(loadedFiles == nbFiles){
								if(location.href.indexOf(cordova.file.dataDirectory) !== 0){ location.href = cordova.file.dataDirectory + 'index.html'; }
								loadDebug();
							}
						  });
						  }
					  else if(event.data.indexOf('change|') === 0){
						  location.reload();
						  }
					  else if(event.data.indexOf('add|') === 0){
							location.reload();
						  
						  }
					  else if(event.data.indexOf('unlink|') === 0){
							location.reload();
						  
						  }
					};

					socket.onclose = function(event) {
					  if (event.wasClean) {
						console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
					  } else {
						// e.g. server process killed or network down
						// event.code is usually 1006 in this case
						console.log('[close] Connection died');
					  }
					};

					socket.onerror = function(error) {
					  console.log(`[error]`, error);
					};
					}
				else{
					appMode = 'release';
					script = document.createElement('script');
					script.setAttribute('type', 'text/javascript');
					script.setAttribute('src', 'js/main.js');
					document.body.appendChild(script);
					}
				console.log("Im: " + ret);
				});
		}, onErrorFunc);
	}, onErrorFunc);
}

function loadDebug(){
	console.log("loadDebug();");	
	setTimeout("document.querySelector('.app').setAttribute('debug', 'true');", 500);
	document.head.querySelectorAll('base')[0].remove();

	base = document.createElement('base');
	base.setAttribute('href', cordova.file.dataDirectory);
	document.head.appendChild(base);

	script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	script.setAttribute('src', cordova.file.dataDirectory+'js__main.js');
	document.body.appendChild(script);
}