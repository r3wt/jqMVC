//internal utilities
function isDefined(t)
{
	return typeof t !== 'undefined';
}
function isString(t)
{
	return typeof t === 'string';
}
function isWindow(t)
{
	return t && t.document && t.location && t.alert && t.setInterval;
}
function isDocument(t)
{
	return window.document === t;
}
function isApp(t)
{
	return t === app;
}

function getPath()
{
	var path = app_path.replace(window.location.origin,'').replace(/\/+/g, '/').trim('/');//possibly unsafe.
	if(path.length === 0){
		path +='/';
	}
	return path;
}

function getQueryString() 
{
	var str = (window.location.search || '?').substr(1);
    if(str.length===0){
        return {};
    }else{
		return str.trim().split('&').reduce(function (ret, param) {
			var parts = param.replace(/\+/g, ' ').split('=');
			ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1]);
			return ret;
		}, {});	
	}
}

function checkRoutes()
{
    var currentUrl = parseUrl(location.pathname);
    var actionList = getParameters(currentUrl);
	var matches = actionList.slice();
	console.log(matches);
    tryRoutes(matches);
}

function tryRoutes(routes) 
{
    if(routes.length === 0){
        emit('notFound');
    }else{
        var route = routes.shift();
        var nextRoutes = routes.slice();
		var oldOnError = window.onerror;
		window.onerror = function(message, file, lineNumber) { return true; };
		function acceptRoute(){
			window.onerror = oldOnError;
			log('jqMVC -> router -> accept');
		}
		try{
            var args = [];
            for(var prop in route.data){
                args.push(route.data[prop]);
            }
            var mwStack = {
                items: route.middleware.slice(),
                next : function(){
                    if(mwStack.items.length > 0){
                        log('jqMVC -> router -> route -> mw -> next');
                        mwStack.items.shift().call(this,mwStack);
                    }else{
                        window.location.query = getQueryString();
                        log('jqMVC -> router -> route -> callback')
                        route.callback.apply(this,args);

                    }
                }
            };
            mwStack.next();
			$(router).off('accept',acceptRoute);
			$(router).one('accept',acceptRoute);
		}
		catch(e){
			var reason = e.toString();
			switch(reason){
				case 'pass':
					tryRoutes(nextRoutes);//try the next route in the stack.
				break;
				case 'halt':
				default:
				break;
			}
			window.onerror = oldOnError;
			log('jqMVC -> router -> '+reason);
		}
    }
	return false;
}

function parseUrl(url)
{
	var currentUrl = url ? url : location.pathname;

	currentUrl = decodeURI(currentUrl);

	// if no pushstate is availabe we have to use the hash
	if (!hasPushState) {   
		if (location.hash.indexOf("#!/") === 0) {
			currentUrl += location.hash.substring(3);
		} else {
		return '';
		}
	}
	
	// and if the last character is a slash, we just remove it
	if(currentUrl.slice(-1) == '/'){
		currentUrl = currentUrl.substring(0, currentUrl.length-1);
	}

	return currentUrl;
}

function getParameters(url)
{
	var dataList = [];
	for (var i = 0; i < routeList.length; i++) {
		var route = routeList[i];
		if (route.type == "regexp") {
			var result = url.match(route.route);
			if (result) {
				var obj = (function(){ return route; }());
				obj.data = {matches: result};
				dataList.push(obj);
			}
		} else {
			var currentUrlParts = url.split("/");
			var routeParts = route.route.split("/");
			if (routeParts.length == currentUrlParts.length) {
				var data = {};
				var matched = true;
				var matchCounter = 0;

				for(var j = 0; j < routeParts.length; j++) {
					if (routeParts[j].indexOf(":") === 0) {
						//its a parameter
						data[routeParts[j].substring(1)] = decodeURI(currentUrlParts[j]);
						matchCounter++;
					} else {
						//not a parameter, ensure the segments match.
						if (routeParts[j] == currentUrlParts[j]) {
							matchCounter++;
						}
					}
				}

				// we've an exact match. break
				if (routeParts.length == matchCounter) {
					var obj = (function(){ return route; }());
					obj.data = data;
					dataList.push(obj);
					router.currentParameters = data;
				}
			}
		}
	}

	return dataList;
}

function handleRoutes(e)
{
	if (e != null && e.originalEvent && e.originalEvent.state !== undefined) {
		checkRoutes();
	}
	else if (hasHashState) {
		checkRoutes();
	}
	else if (!hasHashState && !hasPushState) {
		checkRoutes();
	}
}

function log()
{
	if (debug) {
		window.console && console.log.apply(console,arguments);
	}
}

function emit(event,eventData)
{
	log('jqMVC -> emit -> '+event);
	$(app).trigger(event,eventData);
}

//end internal utilities

//public utils
$.fn.serializeObject = function(){ 
	var b = this.serializeArray();
	var a = {};
	for(var i=0;i<b.length;i++){
		a[b[i].name] = b[i].value;
	}
	return a;
};
//end public utils