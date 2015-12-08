//some browsers fail to set this. 
window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');

//controllers
window.ctrl = {};

// services
window.svc = {};

//require jQuery 2.1.3 or greater
(function($){
	var v = $.fn.jquery.split('.'),
		n = [];
	for(var i=0;i<v.length;i++){
		n.push(parseInt(v[i]));
	}
	switch(true){
		case(n[0] < 2):
		case(n[1] < 1):
		case(n[2] < 3):
			throw 'jqMVC requires jQuery 2.1.3 or greater. Upgrade dummy!';
		break;
	}
}($));

//provide serialize object method for easy form processing
$.fn.serializeObject = function(){ 
	var b = this.serializeArray();
	var a = {};
	for(var i=0;i<b.length;i++){
		a[b[i].name] = b[i].value;
	}
	return a;
};


