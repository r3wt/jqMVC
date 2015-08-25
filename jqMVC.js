/*!
 * jqMVC.js (C) 2015 jQMVC.js Developers, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 * @version 0.1
 */
;!(function($,n,twig,window){
	
	if (!window.location.origin) {
	  window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
	}
	
	var events = [];
	
	var settings = {
		debug: false,
		api_path : '',
		element : '',
		view_path : '',
		ctrl_path : ''
	};
	
	var services = {};
	
	var controller = null;
	
	//code from jquery-router plugin
	var hasPushState = (history && history.pushState);    
    var hasHashState = !hasPushState && ("onhashchange" in window) && false;
    var routeList = [];
    var eventAdded = false;
    var currentUsedUrl = location.href;
    var firstRoute = true;
	
	
	//app
	var app = {};
	app.router = {};
	app.router.currentId = "";
	app.router.currentParameters = {};
    app.router.capabilities = {
        hash: hasHashState,
        pushState: hasPushState,
        timer: !hasHashState && !hasPushState
    };
	
	app.path = function(route,callback){
		var isRegExp = typeof route == "object";
        
        if (!isRegExp)
        {
            
            // remove the last slash to unifiy all routes
            if (route.lastIndexOf("/") == route.length - 1)
            {
                route = route.substring(0, route.length - 1);
            }
            
            // if the routes where created with an absolute url ,we have to remove the absolut part anyway, since we cant change that much
            route = route.replace(location.protocol + "//", "").replace(location.hostname, "");
        }

        var routeItem = {
            route: route,
            callback: callback,
            type: isRegExp ? "regexp" : "string",
        }

        routeList.push(routeItem);
        
        // we add the event listener after the first route is added so that we dont need to listen to events in vain
        if (!eventAdded)
        {
            bindStateEvents();
        }
		return app;
	};
	
	function bindStateEvents()
    {
        eventAdded = true;
        
        // default value telling router that we havent replaced the url from a hash. yet.
        app.router.fromHash = false;

        
        if (hasPushState)
        {
            // if we get a request with a qualified hash (ie it begins with #!)
            if (location.hash.indexOf("#!/") === 0)
            {
                // replace the state
                var url = location.pathname + location.hash.replace(/^#!\//gi, "");
                history.replaceState({}, "", url);
                
                // this flag tells router that the url was converted from hash to popstate
                app.router.fromHash = true;
            }
            
            $(window).bind("popstate", handleRoutes);
        }
        else if (hasHashState)
        {
            $(window).bind("hashchange.router", handleRoutes);
        }
        else
        {
            // if no events are available we use a timer to check periodically for changes in the url
            setInterval(
                function()
                {
                    if (location.href != currentUsedUrl)
                    {
                        handleRoutes();
                        currentUsedUrl = location.href;
                    }
                }, 500
            );
        }
       
    }
    
    bindStateEvents();
	
	app.router.checkRoute = function(url) {
		if(location.pathname == '/'){
			return true;
		}
		return getParameters(parseUrl(url)).length > 0;
	}
	
	app.go = function(url, title)
    {   
        if (hasPushState)
        {
            history.pushState({}, title, url);
            checkRoutes();
        }
        else
        {
            // remove part of url that we dont use
            url = url.replace(location.protocol + "//", "").replace(location.hostname, "");
            var hash = url.replace(location.pathname, "");
            
            if (hash.indexOf("!") < 0)
            {
                hash = "!/" + hash;
            }
            location.hash = hash;
        }
    };
	
	 // parse and wash the url to process
    function parseUrl(url)
    {
        var currentUrl = url ? url : location.pathname;
        
        currentUrl = decodeURI(currentUrl);
        
        // if no pushstate is availabe we have to use the hash
        if (!hasPushState)
        {   
            if (location.hash.indexOf("#!/") === 0)
            {
                currentUrl += location.hash.substring(3);
            }
            else
            {
                return '';
            }
        }
        
        // and if the last character is a slash, we just remove it
        currentUrl = currentUrl.replace(/\/$/, "");

        return currentUrl;
    }
	
	// get the current parameters for either a specified url or the current one if parameters is ommited
    app.router.parameters = function(url)
    {
        // parse the url so that we handle a unified url
        var currentUrl = parseUrl(url);
        
        // get the list of actions for the current url
        var list = getParameters(currentUrl);
        
        // if the list is empty, return an empty object
        if (list.length == 0)
        {
            app.router.currentParameters = {};
        }
        
        // if we got results, return the first one. at least for now
        else 
        {
            app.router.currentParameters = list[0].data;
        }
        
        return app.router.currentParameters;
    }
	
	function getParameters(url)
    {

        var dataList = [];
        
       // console.log("ROUTES:");

        for(var i = 0, ii = routeList.length; i < ii; i++)
        {
            var route = routeList[i];
            
            // check for mathing reg exp
            if (route.type == "regexp")
            {
                var result = url.match(route.route);
                if (result)
                {
                    var data = {};
                    data.matches = result;
                    
                    dataList.push(
                        {
                            route: route,
                            data: data
                        }
                    );
                    
                    // break after first hit
                    break;
                }
            }
            
            // check for mathing string routes
            else
            {
                var currentUrlParts = url.split("/");
                var routeParts = route.route.split("/");
                
                //console.log("matchCounter ", matchCounter, url, route.route)

                // first check so that they have the same amount of elements at least
                if (routeParts.length == currentUrlParts.length)
                {
                    var data = {};
                    var matched = true;
                    var matchCounter = 0;

                    for(var j = 0, jj = routeParts.length; j < jj; j++)
                    {
                        var isParam = routeParts[j].indexOf(":") === 0;
                        if (isParam)
                        {
                            data[routeParts[j].substring(1)] = decodeURI(currentUrlParts[j]);
                            matchCounter++;
                        }
                        else
                        {
                            if (routeParts[j] == currentUrlParts[j])
                            {
                                matchCounter++;
                            }
                        }
                    }

                    // break after first hit
                    if (routeParts.length == matchCounter)
                    {
                        dataList.push(
                            {
                                route: route,
                                data: data
                            }
                        );
						
                        app.router.currentParameters = data;
                        
                        break; 
                    }
                    
                }
            }
            
        }
        
        return dataList;
    }
    
    function checkRoutes()
    {
        var currentUrl = parseUrl(location.pathname);

        // check if something is catched
        var actionList = getParameters(currentUrl);
        
        // ietrate trough result (but it will only kick in one)
        for(var i = 0, ii = actionList.length; i < ii; i++)
        {
            actionList[i].route.callback(actionList[i].data);
        }
    }
    

    function handleRoutes(e)
    {
        if (e != null && e.originalEvent && e.originalEvent.state !== undefined)
        {
            checkRoutes();
        }
        else if (hasHashState)
        {
            checkRoutes();
        }
        else if (!hasHashState && !hasPushState)
        {
            checkRoutes();
        }
    }
	
	
	$(document).on('click','a[data-href]',function(e){
		e.preventDefault();
		app.go( $(this).data('href'),'Loading');
		return false;
	});
	
	// end router code
	
	app.config = function(args){
		$.extend(true,settings,args);
		console.log(settings);
		return app;
	};
	
	app.before = function(){
		n.start();
		return app;
	}
	
	app.done = function(){
		n.done();
		return app;
	};
	
	app.run = function(){
		if(app.router.checkRoute(location.href) == false) {
			app.go('/404');
		}else{
			app.go(location.href);
		}
		return app;
	}
	
	app.notFound = function(){
		console.warn('jqMVC :: 404 Not Found');
	};
	/*
	app.set(k,v){
		app[k] = null;
		delete app[k];
		app[k] = v;
		return app;
	};
	*/
	
	app.render = function(file,args,callback){
		console.log('jqMVC :: render');
		var self = app;
		twig({
			href: settings.view_path+file,
			load: function(template) { 
				var html = template.render(args);
				settings.element.html(html);
				if(typeof callback === "function"){
					console.log('jqMVC :: udc');
					callback.call(self);
				}
			}
		});
		return app;
	};
	
	app.clean = function(){
		if(events.length > 0){
			for(var i=0; i<events.length;i++){
				$app.off(events[i].event,events[i].target,events[i].callback);
			}
			events = [];	
		}
		
		if(controller !== null){
			if(controller.hasOwnProperty('destroy')){
				if(typeof controller.destroy === "function"){
					controller.destroy();
				}
			}
			controller = null;	
		}
		
		if($('script.jqMVCctrl').length > 0){
			$('script.jqMVCctrl').remove();	
		}
		return app;
	};
	
	app.controller = function(ctrl){
		if(controller !== null){
			app.clean();
		}
		var s = document.createElement('script');
		s.setAttribute('src', settings.ctrl_path+ctrl);
		s.className = 'jqMVCctrl';
		var z = null;
		s.onload = function(){
			z = $ctrl;
			z.initialize();
		};
		controller = z;
		document.body.appendChild( s );
		return app;
	};
	
	
	
	app.addSvc = function(name,callback){
		console.log('app.service :: '+name);
		var obj = {}
		obj[name] = callback;
		$.extend(true,services,obj);
		return app;
	};
	
	
	app.svc = function(name){
		
		if(typeof services[name] === "function"){
			var svc = Array.prototype.shift.apply(arguments);
			console.log('jqMVC :: services :: run -> ('+ svc +')');
			return services[svc].apply(this, arguments);
		}
		return app;
	};
	
	app.on = function(event,target,callback){
		if($.isWindow(target)){
			$(window).on(event,callback);
		}else{
			$(document).on(event,target,callback);
		}
		events.push({event:event,target:target,callback:callback});
		return app;
	};

	//controllers can remove events
	app.off = function(event,target,callback){
		if($.isWindow(target)){
			$(window).unbind(event,callback);
		}else{
			$(document).off(event,target,callback);
		}
		return app;
	};

	//immutable events are application wide events you don't want to ever unbind.
	app.immutable = function(event,target,callback){
		$(document).on(event,target,callback);
		return app;
	};
	
	$.jqMVC = app;
	
})(jQuery,NProgress,twig,window);