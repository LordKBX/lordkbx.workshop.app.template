var apiBase = 'http'+((settings.server.secure === true)?'s':'')+'://'+((appMode != 'debug')?settings.server.host:debugHost)+':'+settings.server.port+settings.server.baseUrl
var tmpt = null;

function copy(mainObj) {
	let objCopy = {}; // objCopy will store a copy of the mainObj
	let key;
  
	for (key in mainObj) {
	  objCopy[key] = mainObj[key]; // copies each property to the objCopy object
	}
	return objCopy;
}

if(sessionStorage.getItem('session') == null || false ){ sessionStorage.setItem('session', 1); }
if(sessionStorage.getItem('poste') == null || false ){ sessionStorage.setItem('poste', 1); }

ObjData = { 
	session: sessionStorage.getItem('session'),
	poste: sessionStorage.getItem('poste'),
	scanTimeout: 30000
};
var scanInitialized = false;
var scanedData = null;
var scan_title = 'Scan automatique';
var scan_home = 'Accueil';
var after_title = 'Validation invitation';

ObjMethods = { 
	updatePoste: function(idPoste){ this.poste = idPoste; sessionStorage.setItem('poste', idPoste); },
	updateSession: function(idSession){ this.session = idSession; sessionStorage.setItem('session', idSession); },
	updateScanTimeout: function(scanTimeout){ this.scanTimeout = scanTimeout; sessionStorage.setItem('scanTimeout', scanTimeout); },
	SwitchModeDisplay: function(mode){
		if(mode === undefined){ mode = app.mode; }
		if(mode == 'Scan'){
			$('.app').css('display','none');
			$('#over_scan').css('display','block');
			if(scanInitialized === false){ app.initScanner(); }
		}
		else{
			$('.app').css('display','block');
			$('#over_scan').css('display','none');

			if(mode == 'List'){
				$('#appList').css('display','block');
				$('#appFile').css('display','none');
				$('#pannel_config').css('display','none');
			}
			else if(mode == 'Config'){
				$('#appList').css('display','none');
				$('#appFile').css('display','none');
				$('#pannel_config').css('display','block');
			}
			else if(mode == 'File'){
				$('#appList').css('display','none');
				$('#appFile').css('display','block');
				$('#pannel_config').css('display','none');
			}
		}

		app.source_mode = app.mode;
		app.mode = mode;
	},
	// USER FILE
	OpenUserFile: function(id, idType){
		listIdType = ['id', 'nosoc'];
		console.log('OpenUserFile', id, idType, listIdType.indexOf(idType));
		id = parseInt(id);
		if(isNaN(id)){ return false; }
		if(listIdType.indexOf(idType) == -1){ idType = 'id'; }
		app.user = {};
		for(i=0; i<dataList.length; i++){
			if(dataList[i][idType] == id){
				app.user = dataList[i];
				break;
			}
		}
		if(app.user === {}){ return false; }
		app.SwitchModeDisplay('File');
		ReloadTerminal();
		if(app.signObj !== null){
			delete(app.signObj);
			app.signObj = null;
			$('#signPadReciever *').remove();
			$('#signPadReciever').html('\
			<div class="sigPad" id="signPad" style="margin: 0 auto;">\
				<div class="sigNav">\
					<span class="btn btn-info btn-lg" onclick="signObj.clearCanvas()">Effacer Signature</span>\
				</div>\
				<div class="sig sigWrapper">\
					<canvas class="pad" width="498" height="248"></canvas>\
					<input type="hidden" id="output" name="output" class="output">\
				</div>\
			</div>');
		}
		if(app.user.signature !== undefined){
			if(app.user.signature !== null){
				if(app.user.signature.trim() !== ""){ 
					app.signObj = $('#signPad').signaturePad({displayOnly:true, lineTop:0});
					app.signObj.regenerate(app.user.signature);
					return true;
				} 
			}
		}
		app.signObj = $('#signPad').signaturePad({drawOnly:true, drawBezierCurves:true, lineTop:0});
		app.signObj.clearCanvas(); 
		return true;
		},
	UserDisplayDetails: function(){
		$('#pannel_info .panel-heading').text(app.detailsStartString);
		$('#pannel_info .info-group').text(
			$('.power_table_btn').attr("title").replace(app.detailsStartString,'')
		);
		$('#pannel_info').css('display', 'block');
	},
	UserSave: function(){
		console.log('UserSave()');
		//if(app.user.signature !== null){ if(app.user.signature.trim() !== ""){ return; } }
		if($('#output').val().trim() === ""){ return; }
		$.ajax({
			method: "PUT",
			url: apiBase+'/signature',
			data: {
				'id':app.user.guid,
				'signature':$('#output').val(),
				'numBoitier':app.numboitier
			}
		  })
		.done(function(data){
			console.log('record signature:', data);
			ReloadListe();
			//app.SwitchModeDisplay('List');
			app.SwitchModeDisplay(app.source_mode);
		});
	},
	// SCAN
	ScanOpen: function(){
		app.SwitchModeDisplay('Scan');
		},
	ScanQuit: function(){
		QRScanner.destroy(function(e){ scanInitialized = false; });
	},
	ScanClose: function(){
		app.ScanQuit();
		//app.SwitchModeDisplay(app.source_mode);
		app.SwitchModeDisplay('List');
		},
	initScanner: function(){
		window.QRScanner_SCAN_INTERVAL = 200;
		QRScanner.prepare(app.initScannerDone);
		//setTimeout('QRScanner.hide(function(status){ });', 200);

		$('#over_scan .top_title').text(scan_title);
		$('#after_scan .top_title').text(after_title);
		$('#over_scan .close, #after_scan .close').bind('click', function(e){ app.ScanClose(); });
		$('#over_scan .close, #after_scan .close').text(scan_home);
		},
	initScannerDone: function(err, status){
		if(err){
			console.error(err._message);
			} 
		else{
			console.log('QRScanner is initialized. Status:'); 
			console.log(status);
			scanInitialized = true;
			app.startScan();
			}
		},
	startScan : function(){
		app.timerScan = app.scanTimeout;
		QRScanner.show(function(status){ QRScanner.scan(app.scanReturn); });
		},
	scanReturn : function(err, contents){
		if(err){ console.error(err._message); }
		else{ 
			contents = contents.trim('\n').trim('\r').trim('\n').trim('|').trim(':').trim('/').trim('\\');
			tab = [];
			if(contents.indexOf('|') != -1){ tab = contents.split('|'); }
			else if(contents.indexOf(':') != -1){ tab = contents.split(':'); }
			else if(contents.indexOf('/') != -1){ tab = contents.split('/'); }
			else if(contents.indexOf('\\') != -1){ tab = contents.split('\\'); }
			
			console.log('SCAN Content = '+contents);

			if(tab[0] == 'EKATON' || tab[0] == 'EKACOVEA'){
				app.ScanQuit();
				if(app.OpenUserFile(tab[0], 'nosoc') === false){
					alert('Unknow participant');
					app.startScan();
				}
			}
			else{
				alert('Invalid QRCode 1');
				app.startScan();
				}
			} 
		},
	// CONFIG/SESTTINGS
	ConfigOpen : function(){
		app.SwitchModeDisplay('Config');
		$('#idSession').val(app.session);
		$('#idPoste').val(app.poste);
		$('#scanTimeout').val(app.scanTimeout);
	},
	ConfigClose : function(){
		app.SwitchModeDisplay(app.source_mode);
	},
	ConfigSave : function(){
		
		poste = parseInt($('#idPoste').val());
		session = parseInt($('#idSession').val());
		if(!isNaN(poste) && !isNaN(session)){
			 app.updatePoste(poste);
			 app.updateSession(session);
			 $.get(apiBase+'/api/setSession/'+session).done(function(data){ 
				 $.get(apiBase+'/api/setPoste/'+poste).done(function(data){
					 artest = ['/','/liste','/liste/']
					 if(artest.indexOf(location.pathname) != -1){ $('#pannel_config').css('display','none'); }
					 else{ location.reload(); }
					 }); 
			 });
		 }
	}
};

function ScanDecount(){
	console.log('ScanDecount()');
	if(app.mode != 'Scan'){ return; }
	console.log('app.timerScan = ' + app.timerScan);
	if(app.timerScan<=0){ return; }
	app.timerScan = app.timerScan - 1000;
	if(app.timerScan<=0){
		app.ScanClose();
	}
}

function ReloadListe(){
	$.get(apiBase+'/participants/'+app.session)
		.done(function(data){
			tdata = data.split('<>');
			ndata = JSON.parse(tdata[0]);
			console.log('ReloadListe', tdata[0]);
			/*
			i = 0;
			while(i<data.length){
				line = {
					"guid": data[i].id,
					"name_last": data[i].nom,
					"name_first": data[i].prenom,
					"status": data[i].etat,
					"do_vote": (data[i].etat <=3)?1:0,
					"group": data[i].libelleStatut,
					"title": "",
					"sessions": {},
					"nosoc": data[i].nosoc,
					"adr1": data[i].adr1,
					"adr2": data[i].adr2,
					"city_postal_code": data[i].cp,
					"city_name": data[i].participantVille,
					"signature": data[i].signature
				};
				
				for(index in data[i].sessions){
					line["sessions"][index] = {
						"label": data[i].sessions[''+index].label,
						"terminal": null,
						"nb_vote": parseInt(data[i].sessions[''+index].nbreVote),
						"nb_vote_ext": 0,
						"representant": data[i].sessions[''+index].idRepresentant,
						"procurations_ids": [],
						"procurations_weight": [],
						"procurations": []
					};
				}
				ndata.push(copy(line));
				i = i + 1;
			}
			*/
			if( tdata[0] != app.dataListSign ){
				dataList = ndata;
				app.dataListe = dataList;
				app.dataListSign = tdata[0];
				//if(app.dataListe.length > 200){ app.liste = []; }
				//else{ app.liste = ndata; }
			}
		});
}
var dataList = [];
var dataListSign = "";

function ReloadTerminal(){
	$.get(apiBase+'/boitier/'+app.poste+'/'+app.user.guid)
		.done(function(data){
			console.log('boitier:', data);
			app.numboitier = data;
		});
}

ObjData.mode = "List";
ObjData.research = "";
ObjData.signed = 0;
ObjData.dataListe = JSON.parse('[{"id":"9589","prenom":"","nom":"","etat":"0","nosoc":"0","adr1":" - ","adr2":"--","cp":"","participantVille":"","signature":"","libelleSensibilite":"SALARIES","libelleStatut":"AG2R","sessions":{"1":{"nbreVote":"0","nbreVoteExt":0,"idRepresentant":null,"label":"ARPEGE","procurations":[]}}},{"id":"500","prenom":"00000--PAR","nom":"","etat":"0","nosoc":"0","adr1":"1 RUE DU DR ALBERT SCHWEITZER - ","adr2":"--c.epp@clestra.com","cp":"67411","participantVille":"ILLKIRCH GRAFFENSTADEN CEDEX","signature":"","libelleSensibilite":"SALARIES","libelleStatut":"AG2R","sessions":{"1":{"nbreVote":"240","nbreVoteExt":0,"idRepresentant":null,"label":"ARPEGE","procurations":[]}}},{"id":"499","prenom":"XX - EKATON-PAR","nom":"","etat":"2","nosoc":"0","adr1":" - ","adr2":"Donner pouvoir -je donne mandat a-p.tranchant@ekaton.fr","cp":"93100","participantVille":"","signature":"","libelleSensibilite":"SALARIES","libelleStatut":"AG2R","sessions":{"1":{"nbreVote":"0","nbreVoteExt":0,"idRepresentant":null,"label":"ARPEGE","procurations":[]}}}]');
ObjData.liste = copy(ObjData.dataListe);
ObjData.liste_activs = JSON.parse('[1,2,4,5,6,7,8]');
ObjData.liste_order = JSON.parse('[1,4,2,3,5,6,7,8]');
ObjData.intervalListe = setInterval(ReloadListe, 60000);
ObjData.intervalScanDecount = setInterval(ScanDecount, 1000);
ObjData.timerScan = 30000;

ObjData.fiche_activs = JSON.parse('[1,3,4,5,6,7,8,9]');
ObjData.fiche_order = JSON.parse('[3,1,2,4,5,6,7,8,9]');
ObjData.fiche_powers_libelle1 = 'Mes Voix';
ObjData.fiche_powers_libelle2 = 'Voix Reçues';

ObjData.user = {};
ObjData.signature = '';
ObjData.numboitier = 0;
ObjData.detailsStartString = 'Détails des Voix Reçues: ';
ObjData.signObj = null;

ObjData.dataListSign = "";

sorter = function () {
		ulist = $('#tlist tr');
		for(i=0; i<ulist.length; i++){
			divList = $('#'+ulist[i].id+' td');
			divList.sort(function(a, b){
				odr = $(a).attr("order") - $(b).attr("order");
				if(odr > 0 || odr < 0){return (odr > 0)?1:-1;}
				else{ return 0; }
			});
			$('#'+ulist[i].id).html(divList);
		}
	};

ObjMethods.searching = function(user, signed){
	if(user.sessions[this.session] === undefined){ return false; }
	if(signed === undefined){ signed = this.signed; }
	if(signed === 0){
		if(user.signature !== undefined && user.signature !== null){
			if(user.signature.trim() !== ''){
				return false;
			}
		 }
		//if(user.signatures[this.session] !== null){ return false; }
	}
	else{
		if(user.signature === undefined || user.signature === null){ return false; }
		else{
			if(user.signature.trim() === ''){ return false; }
		}
		//if(user.signatures[this.session] === null){ return false; }
	}
	if(this.research === ""){ return true; }
	if(user.nom.toLowerCase().search(this.research.toLowerCase()) != -1){ return true; }
	if(user.prenom.toLowerCase().search(this.research.toLowerCase()) != -1){ return true; }
	return false;
};

app = new Vue({
	el: '#vueApp',
	data: ObjData,
	methods: ObjMethods,
	computed: {
		getNbTotal: function () {
			ret = 0;
			return this.dataListe.length;
			},
		getNbWait: function () {
			ret1 = ret2 = 0;
			for(i in this.dataListe){
				if(this.dataListe[i].status <= 0){ ret1 = ret1 + 1; }
				if(this.searching(this.dataListe[i], 0) === true){ ret2 = ret2 + 1; }
				/*
				if(this.liste[i].sessions[this.session] !== undefined){
					if(this.liste[i].signatures[this.session] === null){ ret1 = ret1 + 1; }
					if(this.searching(this.liste[i], 0) === true){ ret2 = ret2 + 1; }
				}
				*/
			}
			return [ret1, ret2];
		},
		getNbHere: function () {
			ret1 = ret2 = 0;
			for(i in this.dataListe){
				if(this.dataListe[i].sessions[this.session] !== undefined){
					//if(this.liste[i].signatures[this.session] !== null){ ret1 = ret1 + 1; }
					if(this.dataListe[i].status == 1){ ret1 = ret1 + 1; }
					if(this.searching(this.dataListe[i], 1) === true){ ret2 = ret2 + 1; }
				}
			}
			return [ret1, ret2];
		},
		getDetailsText: function () {
			ret = this.detailsStartString;
			usess = this.user.sessions[this.session];
			console.log(usess);
			if(usess.nb_vote_ext === 0){ ret = ret + 'Aucune Voix Reçues'; }
			else{
				for(i=0; i < usess.procurations.length; i++){
					if(i > 0){ ret = ret + ', '; }
					ret = ret + usess.procurations[i].label_title 
						+ ' ' + usess.procurations[i].name_first 
						+ ' ' + usess.procurations[i].name_last
						+ '(' + usess.procurations_weight[usess.procurations[i].id] + ')';
				}
			}
			return ret;
		}
	},
	mounted: sorter,
	updated: sorter
});

$('#pannel_config_cancel').bind('click', app.ConfigClose);
$('#pannel_info_ok').bind('click', function(e){ $('#pannel_info').css('display', 'none'); });
$("#appFile .power_table_btn").bind('click', app.UserDisplayDetails);

if(appMode == 'debug'){ document.querySelector('.app').setAttribute('debug', 'true'); }

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
	
	style = '';

	scase = ww;
	if(scase > wh){scase = wh;}
	scase = parseInt(scase * 0.8);

	style = style + '#over_scan .reticle{width:'+scase+'px;height:'+scase+'px;top:calc(50% - '+(scase/2)+'px);left:calc(50% - '+(scase/2)+'px);}\n';
	
	$('#variable_style').html(style);
}


ReloadListe();

resize_window();
var resizeWindowInterval = setInterval(resize_window, 1000);