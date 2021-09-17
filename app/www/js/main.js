var settings = {};
var pageBase = null;

var default_segment = 'Home';
var current_segment = 'Home';
var previous_segment = 'Home';

var menuData = [];
var menuIsOn = false;
var menuIsOnDisplay = false;

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
                        setTimeout("if(menuIsOn == false){ $('.app').addClass('headless'); }", 300);
                    }
                });
                if(navigator.userAgent.search('iPad') != -1 || navigator.userAgent.search('iPhone') != -1){ 
                    setTimeout("document.documentElement.className = 'ios';", 200); 
                }
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
    DirectReadDataFile(path, function(data){
        baseConf = (appMode == 'debug')?cordova.file.dataDirectory+'segments__':cordova.file.applicationDirectory+'www/segments/';

        section = document.createElement('section');
        section.setAttribute('id', 'section_'+name);
        section.setAttribute('style', 'display:'+((default_segment == name.replace('__','/'))?'block':'none'));

        regex = /src="(.*)"/g;
        found = data.match(regex);
        console.log('found = ', found);

        if(found != null){
            for(fi = 0; fi < found.length; fi++){
                fil = baseConf + dbgPath(found[fi].replace('src="', '').replace('"', ''));

                data = data.replace(found[fi], 'src="'+fil+'"');
                /*
                id = MGUID();
                data = data.replace(found[fi], 'id="'+id+'"')
                console.log('fil =', fil);
                loadIFileInBlob(fil, id, 'image/png', function(ret, dest_id){
                    console.log('ret =', ret);
                    $('#'+dest_id).attr('src', ret);
                })
                */
            }
        }

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
    baseConf = (appMode == 'debug')?cordova.file.dataDirectory+'segments__':cordova.file.applicationDirectory+'www/segments/';
    DirectReadDataFile(path, function(data){
        try{ 
            menuData = JSON.parse(data);
            console.log('menu data', menuData);

            divtop = document.createElement('div');
            divtop.setAttribute('id', 'header');
            divtop.innerHTML = '<span class="glyphicon glyphicon-menu-hamburger" onclick="toogleMenu();"></span> <span class="title">title</span>';
            document.body.querySelector('.app').prepend(divtop);

            nav = document.createElement('nav');
            nav.setAttribute('style', 'left:-150px');
            nav.innerHTML = '<div class="top"></div><div class="bottom"></div>';

            for(i=0; i<menuData.length; i++){
                link = document.createElement('a');
                if(default_segment == menuData[i].segment){ document.body.querySelector('#header .title').innerText = menuData[i].name; }
                link.setAttribute('onclick', "switchToSection('"+menuData[i].segment+"');"+((menuData[i].action !== undefined && menuData[i].action !== null)?menuData[i].action:'') );
                
                ctl = '<table><tbody><tr>';
                if(menuData[i].icon !== undefined && menuData[i].icon !== null)
                    { ctl += '<td><span class="glyphicon glyphicon-'+menuData[i].icon+'"></span></td>'; }
                if(menuData[i].fileIcon !== undefined && menuData[i].fileIcon !== null)
                    { ctl += '<td><span class="fileicon" style="background:url(\''+baseConf + dbgPath(menuData[i].fileIcon)+'\'); background-size: 100%; background-repeat: no-repeat;"></span></td>'; }

                link.innerHTML = ctl + '<td class="right"><span>' + menuData[i].name + '</span></td></tr></tbody></table>';
                if(menuData[i].bottom === true){ nav.querySelector('.bottom').appendChild(link); }
                else{ nav.querySelector('.top').appendChild(link); }
            }

            document.body.appendChild(nav);
            menuIsOn = true;
        }
        catch(err){ console.error(err); return; }
    });
}

function switchToSection(id){
    if(document.querySelector('.app #section_'+id.replace('/','__')) === null){ return; }
    name = id;
    for(i=0; i<menuData.length; i++){
        if(menuData[i].segment == id){ name = menuData[i].name; }
    }

    $('.app section').css('display', 'none');
    document.querySelector('.app #section_'+id.replace('/','__')).style.display = 'block';

    toogleMenu(true);
    document.body.querySelector('.app #header .title').innerText = name;
}

function toogleMenu(toClose){
    pan = document.querySelector('nav');
    if(menuIsOnDisplay === true || toClose === true){
        pwidth = pan.offsetWidth;
        pan.style.left = '-'+pwidth+'px';
        menuIsOnDisplay = false;
    }
    else{
        pan.style.left = '0px';
        menuIsOnDisplay = true;
    }  
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
