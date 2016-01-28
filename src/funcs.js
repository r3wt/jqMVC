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
    return (!path.length ? '/' : path);
}

function getQueryString() 
{
    var str = (window.location.search || '?').substr(1);
    return (!str.length ? {} : str.trim().split('&').reduce(function (ret, param) {
        var parts = param.replace(/\+/g, ' ').split('=');
        ret[parts[0]] = parts[1] === undefined ? null : decodeURIComponent(parts[1]);
        return ret;
    }, {}));    
}

function checkRoutes()
{
    var currentUrl = parseUrl(location.pathname);
    var actionList = getParameters(currentUrl);
    var matches = actionList.slice();
    log(matches);
    tryRoutes(matches);
}

function tryRoutes(routes) 
{
    if(routes.length === 0){
        emit('notFound');
    }else{
        var route = routes.shift();
        var nextRoutes = routes.slice();
		var oldError = window.onerror;
		window.onerror = function(e){
			var e = e.replace('uncaught exception:','').trim();
			switch(e){
				case 'accept':
					log('jqMVC -> router -> accept');
				break;
                case 'pass':
					log('jqMVC -> router -> pass');
                    tryRoutes(nextRoutes);//try the next route in the stack.
                break;
                case 'halt':
					log('jqMVC -> router -> halt');
                break;
                default:
                    log('jqMVC -> router -> uncaught exception: '+e); //log exception and return.
                break;
            }
			window.onerror = oldError;
			return true;
		};
		var args = [];
		for(var prop in route.data){
			args.push(route.data[prop]);
		}
		var mwStack = {
			items: route.middleware.slice(),
			next : function(){
				window.location.query = getQueryString(); // #75
				if(mwStack.items.length > 0){
					log('jqMVC -> router -> route -> mw -> next');
					mwStack.items.shift().call(this,mwStack);
				}else{
					log('jqMVC -> router -> route -> callback');
					route.callback.apply(this,args);
				}
			}
		};
		mwStack.next();
    }
    return;
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
    if ( (e != null && e.originalEvent && e.originalEvent.state !== undefined) || hasHashState || (!hasHashState && !hasPushState) ) {
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

function escapeRegExp(str)
{
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

$.fn.serializeObject = function()
{ 
    var b = this.serializeArray();
    var a = {};
    for(var i=0;i<b.length;i++){
        a[b[i].name] = b[i].value;
    }
    return a;
};

$.fn.jq = function(attr,val)
{
    if(typeof attr === 'string'){
        if(typeof val !== 'undefined'){
            this.attr('jq-'+attr,val);
        }else{
            return this.attr('jq-'+attr);
        }
    }
    return this;
};

function jobPending()
{
    for(var job in jobs){
        //called by the system before navigation to temporarily suspend jobs.
        //therefore we make sure a job isnt paused so it wont be resumed after app.done() is called
        if(jobs[job].state !== 3){
            safelyStopJob(job,0);
        }
    }   
}

function safelyStopJob(job,newState)
{
	if(jobs[job].state !== 1 && jobs[job].state !== 2){
		jobs[job].state = newState;
        clearInterval(jobs[job].timer);
		if(newState == -1){
			delete jobs[job];
		}
	}else{
		setTimeout(function(){ safelyStopJob(job,newState); }, 10);
	}
}

function jobResume(targets,ignoreState)
{
	var obj = (targets === undefined || (targets !== undefined && targets === '*')) ? jobs : false;
	if(!obj){
		obj = {};
		if(jobs.hasOwnProperty(targets)){
			obj[targets] = jobs[targets];
		}
	}
	for(var job in obj){
		if(jobs[job].state == 0 || ignoreState !== undefined){
			jobs[job].state = 1;
			jobs[job].timer = setInterval(function(){
				if(jobs[job].state !== 2){
					jobs[job].state = 2;
					jobs[job].payload.call(this);
					jobs[job].state = 1;
				}
			},jobs[job].interval);
		}
	}          
}

function jobPause(targets)
{
    if(targets === '*'){
        for(var job in jobs){
			safelyStopJob(job,3);
        }
    }else{
        if(jobs.hasOwnProperty(targets)){
            safelyStopJob(targets,3);
        }
    }
}

function jobDestroy(targets)
{
    if(targets == '*'){
        for(var job in jobs){
            safelyStopJob(job,-1);
        }
    }else{
        if(jobs.hasOwnProperty(job)){
            safelyStopJob(job,-1);
        }
    }
}

function jobInspect(targets)
{
    if(targets === '*'){
        return jobs;
    }else{
        if(jobs.hasOwnProperty(targets)){
            return jobs[targets];
        }else{
            return 'job doesnt exist';
        }
    }
}

function timeParse(t)
{
    log('parsing time: '+t);
    if(typeof t == 'string'){
        var m = t.match(/^(\d+)(MS|S|M|H|ms|s|m|h)$/);
        if(m.length == 3){
            var a = parseInt(m[1]),
                b = m[2].toLowerCase(),
                c = {
                    ms: 1,
                    s : 1000,
                    m : 60000,
                    h : 3.6e+6
                };
            t = a * c[b];
        }else{
            t = -1;
        }
    }
    log('parsed time: ' + t);
    return t;
}