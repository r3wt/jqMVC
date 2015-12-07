//everything event related
var jQselector = $.fn.init,
jQbound = [],
evt={};
$.fn.init = function(selector){
	
	var trackSelector =  isDefined(selector) && !isApp(selector) && (( isString(selector) || isWindow(selector) || isDocument(selector) ) !== false);
	
	var jQinstance = new jQselector(selector,window.document,$);
	
	// we only track events bound on element(s), document, and window. 
	// events bound on plain objects, such as those that are internally 
	// bound with public methods $.jqMVC.listen and $.jqMVC.listenOnce
	if(trackSelector){
		jQbound = app.merge(jQbound,[selector]);//to prevent dupes in jqBound
	}

	return jQinstance;
};
    
evt.bindRouter = function(){
	eventAdded = true;
	router.fromHash = false;

	if (hasPushState) {
		if (location.hash.indexOf("#!/") === 0) {
			var url = location.pathname + location.hash.replace(/^#!\//gi, "");
			history.replaceState({}, "", url);
			router.fromHash = true;
		}

		$(window).bind("popstate", handleRoutes);
		
	} else if (hasHashState) {
		$(window).bind("hashchange.router", handleRoutes);
	} else {
		// if no events are available we use a timer to check periodically for changes in the url
		router.interval = setInterval(function(){
			if (location.href != currentUsedUrl) {
				handleRoutes();
				currentUsedUrl = location.href;
			}
		}, 500);
	}
};

evt.bindHref = function()
{
	$(document).on('click','a[data-href]',function(e){
		e.preventDefault();
		emit('before.go');
		app.go( getPath().replace(/\/+$/, '')+$(this).data('href') ,'Loading');
		return false;
	});
};

evt.bindForm = function()
{
	$(document).on('submit','form[ctrl][action][callback]',function(event){
		event.preventDefault();
		var _this         = $(this),
		before_function   = _this.attr('before'),
		callback_function = _this.attr('callback'),
		endpoint          = api_path+_this.attr('action'),
		controller        = window.ctrl[_this.attr('ctrl')],
		query_string      = _this.serializeObject();
		console.log(query_string);
		$.jqMVC.before();
		_this.find('button[type="submit"]').prop('disabled',true);
		if(typeof before_function !== "undefined" && before_function !== false){
			var before_error = controller[before_function].call(_this);
			if(before_error !== false){
				$.jqMVC.alert(before_error,'error');
				return;
			}
		}
		if(typeof callback_function === "undefined" || callback_function === false){
			$.jqMVC.alert('FORM DOES NOT SPECIFY CALLBACK. UNABLE TO CONTINUE.','error');
			return;
		}
		$.post(endpoint,query_string,function(data){
			var data = JSON.parse(data);
			controller[callback_function].call( _this, data );
		}).fail(function( jqXHR, textStatus, errorThrown ){
			controller[callback_function].call(_this,{'error':1,'message': 'An Unknown Error Occured: '+jqXHR.status +' '+ jqXHR.responseText});
		}).always(function(){
			$.jqMVC.done();
			_this.find('button[type="submit"]').prop('disabled',false);
		});
		return false;
	});
};

function unbindEvents()
{
	for(var i=0;i<jQbound.length;i++){
		$(jQbound[i]).find("*").addBack().off();
	}
	jQbound.length = 0;
	clearInterval(router.interval);//if router is using an interval it must be destroyed.
}

function bindEvents()
{
	for(var c in evt){
		evt[c].apply(this);
	}
}
//end events