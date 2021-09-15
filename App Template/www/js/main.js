var settings = {};
var pageBase = null;

var default_segment = 'Home';
var current_segment = 'Home';
var previous_segment = 'Home';

var menuIsOn = false;

function mainInit() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory:cordova.file.applicationDirectory+'www/';
    

    window.resolveLocalFileSystemURL(baseConf, function (dirEntry) {
		console.log('file system open: ' + dirEntry.name);
		dirEntry.getFile("config.json", { create: false, exclusive: false }, function (fileEntry) {
			readFile(fileEntry, function(ret){
                console.log(ret);
                try{ settings = JSON.parse(ret); }
                catch(err){ settings = ret; }

                default_segment = clone(settings.default_segment);
                current_segment = clone(settings.default_segment);
                previous_segment = clone(settings.default_segment);

                console.log('=> Load global style');
                links = ['css/bootstrap.min.css', 'css/bootstrap-theme.min.css', 'css/app.css'];
                for(i=0; i<links.length; i++){
                    link = document.createElement('link');
                    link.setAttribute('media', 'all');
                    link.setAttribute('type', 'text/css');
                    link.setAttribute('rel', 'stylesheet');
                    link.setAttribute('href', cordova.file.applicationDirectory+'www/'+links[i]);
                    document.body.appendChild(link);
                }
                injectScript('js/bootstrap.min.js');

                console.log('=> Load segments');
                path = (appMode == 'debug')?baseConf:baseConf+'segments/';
                listDir(path, function(data){
                    if(data !== false){
                        if(appMode == 'debug'){
                            for(var j=0; j<data.length; j++){
                                console.log(data[j]);
                                if(data[j].search('segments__') === 0){
                                    console.log(data[j]);
                                    filename = data[j].replace('segments__','').replace('.html','').replace('.css','');

                                    if(data[j].search('.html') != -1){ injectSegment(path+data[j], filename); }
                                    if(data[j].search('.css') != -1){ injectCss(path+data[j], filename); }
                                    if(data[j].search('.js') != -1){ injectScript(path+data[j]); }
                                    if(data[j].search('.nav') != -1){ buildMenu(path+data[j]); }
                                }
                            }
                        }
                        else{
                            for(var k=0; k<data.length; k++){
                                filename = data[k].replace('.html','').replace('.css','');
                                if(data[k].search('.html') != -1){ injectSegment(path+data[k], filename); }
                                if(data[k].search('.css') != -1){ injectCss(path+data[k], filename); }
                                if(data[k].search('.js') != -1){ injectScript(path+data[k]); }
                                if(data[j].search('.nav') != -1){ buildMenu(path+data[k]); }
                            }
                        }
                        console.log(JSON.stringify(data));
                    }
                });
                if(navigator.userAgent.search('iPad') != -1 || navigator.userAgent.search('iPhone') != -1){ setTimeout("document.body.className = 'ios';", 200); }
			});
		}, onErrorFunc);
	}, onErrorFunc);
}

function injectScript(path){
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory:cordova.file.applicationDirectory+'www/';

    DirectReadDataFile(path, function(data){
        script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.innerHTML = data;
        document.body.appendChild(script);
    });
}

function injectSegment(path, name){
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory:cordova.file.applicationDirectory+'www/';
    DirectReadDataFile(path, function(data){
        section = document.createElement('section');
        section.setAttribute('id', 'section_'+name);
        section.setAttribute('style', 'display:'+((default_segment == name.replace('__','/'))?'block':'none'));
        section.innerHTML = data;
        document.body.querySelector('.app').appendChild(section);
    });
}

function injectCss(path, name){
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory:cordova.file.applicationDirectory+'www/';
    DirectReadDataFile(path, function(data){
        css = document.createElement('style');
        css.setAttribute('id', 'style_'+name);
        css.innerHTML = data;
        document.body.appendChild(css);
    });
}

function buildMenu(path){
    if(menuIsOn === true){ return; }
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory:cordova.file.applicationDirectory+'www/';
    DirectReadDataFile(path, function(data){
        try{ 
            menuData = JSON.parse(data);
            console.log('menu data', menuData);

            nav = document.createElement('nav');

            for(i=0; i<menuData.length; i++){
                link = document.createElement('a');
                link.setAttribute('onclick', "switchToSection('"+menuData[i].segment+"');"+((menuData[i].action !== undefined && menuData[i].action !== null)?menuData[i].action:'') );
                if(menuData[i].bottom === true){
                    link.setAttribute('style', 'float: bottom;');
                }

                link.innerHTML = ((menuData[i].icon !== undefined && menuData[i].icon !== null)?'<span class="glyphicon glyphicon-'+menuData[i].icon+'"></span>':'')
                    + '<span>' + menuData[i].name + '</span>';
                nav.appendChild(link);
            }

            document.body.appendChild(nav);

        }
        catch(err){ console.error(err); return; }
    });
}

function switchToSection(name){
    if(document.querySelector('.app #section_'+name.replace('/','__')) === null){ return; }
    $('.app section').css('display', 'none');
    document.querySelector('.app #section_'+name.replace('/','__')).style.display = 'block';
}

function resize_window(){
    ww = window.innerWidth;
    wh = window.innerHeight;
    // détection Pré-existence zone d'injection css
    if($('#variable_style').length == 0){
        var mstyle = document.createElement('style');
        mstyle.type = 'text/css';
        mstyle.innerHTML = '';
        mstyle.setAttribute('id','variable_style');
        document.getElementsByTagName('body')[0].appendChild(mstyle);
        }
}

/*
function ScanDecount(){
	//console.log('ScanDecount()');
	if(current_segment != 'Scan'){ return; }
	//console.log('app.timerScan = ' + app.timerScan);
	if(timerScan<=0){ return; }
	timerScan = timerScan - 1000;
	if(timerScan<=0){
		ScanClose();
	}
}
*/

mainInit();
resize_window();
var resizeWindowInterval = setInterval(resize_window, 1000);
