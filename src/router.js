
router.normalize = function(url,keep_qs)
{
	if(app_path !== '/' && url.indexOf(app_path) !== 0){
		url = (app_path + url).trim('/');
	}
	
	url = url.replace(new RegExp(window.location.origin,'g'),'').replace(/\/+/g, '/').trim('/');
	if(typeof keep_qs === 'undefined'){
		url = url.split('?')[0];
	}
	
	if(!url.length){
		url = '/';
	}
	log('jqMVC -> router -> normalize :: '+url);
	return url;
};

router.go = function(url)
{
	url = router.normalize(url,true);
	history.pushState({}, null, url);
	router.checkRoutes();
};

router.currentId = "";
router.currentParameters = {};

// get the current parameters for either a specified url or the current one if parameters is ommited
router.params = function(url)
{
    // parse the url so that we handle a unified url
    var currentUrl = router.normalize(url);

    // get the list of actions for the current url
    var list = router.params(currentUrl);

    // if the list is empty, return an empty object
    if (list.length == 0) {
        router.currentParameters = {};
    } else {
        router.currentParameters = list[0].data;// if we got results, return the first one. at least for now
    }

    return router.currentParameters;
};

router.checkRoutes = function()
{
    var currentUrl = router.normalize(location.href);
    var actionList = router.params(currentUrl);
    var matches = actionList.slice();
    log('jqMVC -> router -> checkRoutes :: found '+matches.length+' routes',matches);
    router.tryRoutes(matches);
};

router.tryRoutes = function(routes) 
{
    if(routes.length === 0){
        emit('notFound');
    }else{
        var route = routes.shift();
        var nextRoutes = routes.slice();
		var oldError = window.onerror;
		window.onerror = function(e){
			e = e.replace('uncaught exception:','').trim();
			switch(e){
				case 'accept':
					log('jqMVC -> router -> accept');
				break;
                case 'pass':
					log('jqMVC -> router -> pass');
                    router.tryRoutes(nextRoutes);//use recursion to cycle through matched routes.
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
};

router.params = function(url)
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
};

router.popstate = function(e)
{
    if (e !== null && e.originalEvent && e.originalEvent.state !== undefined) {
		log('jqMVC -> router -> popstate');
        router.checkRoutes();
	}
};