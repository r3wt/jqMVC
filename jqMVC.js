/*!
 * jqMVC.js (C) 2015 jqMVC.js Developers, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 * @version 0.1
 * contains heavily modified code originally written by camilo tapia https://github.com/camme/jquery-router-plugin
 */

;!(function($,n,twig,window){

    //fix for browsers that dont have location.origin
    if (!window.location.origin) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    }

    var emittable = [
		'on.before',
		'firstRun',
        'before.go',
        'on.go',
        'before.render',
        'on.render',
        'on.done',
        'on.controller',
        'on.service',
        'on.module',
        'on.clean',
        'notFound'
    ]; // a list of emittable events
	
    var events = [];
    var services = {};
    var controller = null;
    var hasPushState = (history && history.pushState);    
    var hasHashState = !hasPushState && ("onhashchange" in window) && false;
    var routeList = [];
    var eventAdded = false;
    var currentUsedUrl = location.href;
    var firstRoute = true;
    var app = {};
	var firstRun = false;
	
	var stack = {};
	
	stack.items = [];
	
	stack.next = function(){
		stack.items.shift().call($,stack);
	};
    
	
	
    app.router = {};
    app.router.currentId = "";
    app.router.currentParameters = {};
    app.router.capabilities = {
        hash: hasHashState,
        pushState: hasPushState,
        timer: !hasHashState && !hasPushState
    };
	
	
	app.add = function(callable){
		stack.items.push(callable);
		return app;
	};
	
	app.trigger = function(event,eventData){
		emit(event,eventData);
		return app;
	};

    app.path = function(route,callback)
    {
        var isRegExp = typeof route == "object";

        if (!isRegExp) {
            // remove the last slash to unifiy all routes
            if (route.lastIndexOf("/") == route.length - 1) {
            route = route.substring(0, route.length - 1);
            }
            // if the routes where created with an absolute url ,we have to remove the absolut part anyway, since we cant change that much
            route = route.replace(location.protocol + "//", "").replace(location.hostname, "");
        }

        routeList.push({
            route: route,
            callback: callback,
            type: isRegExp ? "regexp" : "string",
        });

        // we add the event listener after the first route is added so that we dont need to listen to events in vain
        if (!eventAdded) {
            bindStateEvents();
        }
        return app;
    };
	
	app.loadModule = function(path){
		var path = window.location.origin +'/'+ module_path + path;
		var s = document.createElement('script');
        s.setAttribute('src', path);
        s.className = 'jqMVCmodule';
        document.body.appendChild( s );
		return app;
	};

    function bindStateEvents()
    {
        eventAdded = true;

        // default value telling router that we havent replaced the url from a hash. yet.
        app.router.fromHash = false;

        if (hasPushState) {
            if (location.hash.indexOf("#!/") === 0) {
                // replace the state
                var url = location.pathname + location.hash.replace(/^#!\//gi, "");
                history.replaceState({}, "", url);
                app.router.fromHash = true;
            }

            $(window).bind("popstate", handleRoutes);
            
        } else if (hasHashState) {
            $(window).bind("hashchange.router", handleRoutes);
        } else {
            // if no events are available we use a timer to check periodically for changes in the url
            setInterval(function(){
                if (location.href != currentUsedUrl) {
                    handleRoutes();
                    currentUsedUrl = location.href;
                }
            }, 500);
        }

    };

    app.router.checkRoute = function(url) 
    {
        return getParameters(parseUrl(url)).length > 0;
    };

    app.go = function(url, title)
    {   
        if (hasPushState) {
            history.pushState({}, title, url);
            checkRoutes();
        } else {
            // remove part of url that we dont use
            url = url.replace(location.protocol + "//", "").replace(location.hostname, "");
            var hash = url.replace(location.pathname, "");
            if (hash.indexOf("!") < 0)
            {
                hash = "!/" + hash;
            }
            location.hash = hash;
        }
		return app;
    };

    // parse and wash the url to process
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
    };

    // get the current parameters for either a specified url or the current one if parameters is ommited
    app.router.parameters = function(url)
    {
        // parse the url so that we handle a unified url
        var currentUrl = parseUrl(url);

        // get the list of actions for the current url
        var list = getParameters(currentUrl);

        // if the list is empty, return an empty object
        if (list.length == 0) {
            app.router.currentParameters = {};
        } else {
            app.router.currentParameters = list[0].data;// if we got results, return the first one. at least for now
        }

        return app.router.currentParameters;
    };

    function getParameters(url)
    {
        var dataList = [];
        for (var i = 0; i < routeList.length; i++) {
            var route = routeList[i];
            if (route.type == "regexp") {
                var result = url.match(route.route);
                if (result) {
                    dataList.push({
                        route: route,
                        data: {matches: result}
                    });

                    // break after first hit
                    break;
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
                        dataList.push({
                            route: route,
                            data: data
                        });
                        app.router.currentParameters = data;
                        break; 
                    }
                }
            }
        }

        return dataList;
    };

    function checkRoutes()
    {
        var currentUrl = parseUrl(location.pathname);
        // check if something is cached
        var actionList = getParameters(currentUrl);
		if(actionList.length === 0){
			emit('notFound');
		}else{
			for(var i = 0; i < actionList.length; i++)
			{
				actionList[i].route.callback(actionList[i].data);
			}	
		}
       
    };

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
    };

    function debugmsg(msg)
    {
        if (debug) {
            window.console && console.log('$.jqMVC :: ' + msg);
        }
    };

    function emit(event,eventData)
    {
        debugmsg('emit -> `'+event+'`');
        $(app).trigger(event,eventData);
    };

    function bind_href()
    {
        emit('on.bindhref');
        app.on('click','a[data-href]',function(e){
            e.preventDefault();
            emit('before.go');
            app.go( $(this).data('href') ,'Loading');
            return false;
        }); 
    };

    app.listen = function(event,callback)
    {
        $(app).bind(event,callback);
		return app;
    };
	
	app.data = function(args)
	{
		for(var prop in args){
			window[prop] = args[prop];
		}
		return app;
	};

    app.before = function()
    {
        n.start();
        return app;
    };

    app.done = function()
    {
        emit('on.done');
        n.done();
        bind_href();
        return app;
    };

    app.run = function()
    {
		if(!firstRun){
			bindStateEvents();
			emit('firstRun');
			firstRun = true;
		}
		app.add(function(){
			app.go(location.href);
		});
		stack.next();
        return app;
    };

    app.render = function(file,args,callback,el)
    {
        emit('before.render');
		var self = this;
        twig({
            href: view_path+file,
            load: function(template) { 
                var html = template.render(args);
                emit('on.render');
                var target = (el === undefined) ? element : el;
                target.html(html);
                if (typeof callback === "function") {
                    callback.call(self);
                }
            },
            cache: tpl_cache
        });
        return app;
    };

    app.clean = function()
    {
        if (events.length > 0) {
            for (var i=0; i<events.length;i++) {
                app.off(events[i].event,events[i].target,events[i].callback);
            }
            events.length = 0;//truncate array.
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
        emit('on.clean');
        return app;
    };

    app.controller = function(path)
    {
		var path = window.location.origin +'/'+ ctrl_path + path;
        app.clean();
        var s = document.createElement('script');
        s.setAttribute('src', path);
        s.className = 'jqMVCctrl';
        var z = null;
        s.onload = function(){
            emit('on.controller');
            z = $ctrl;
            z.initialize();
        };
        controller = z;
        document.body.appendChild( s );
        return app;
    };

    app.addSvc = function(name,callback)
    {
        var obj = {};
        obj[name] = callback;
        $.extend(true,services,obj);
        return app;
    };


    app.svc = function(name)
    {
        if (typeof services[name] === "function") {
            var svc = Array.prototype.shift.apply(arguments);
            services[svc].apply(this, arguments);
            emit('on.service');
        }
        return app;
    };
	
	//bind events directly to $.jqMVC

    app.on = function(event,target,callback)
    {
        if ($.isWindow(target)) {
            $(window).on(event,callback);
        } else {
            $(document).on(event,target,callback);
        }
        events.push({
            event:event,
            target:target,
            callback:callback
        });
        return app;
    };

    app.off = function(event,target,callback)
    {
        if ($.isWindow(target)) {
            $(window).unbind(event,callback);
        } else {
            $(document).off(event,target,callback);
        }
        return app;
    };
	
	//merge 2 arrays. in future should be infinite number
	app.merge = function(a1,a2){
		if(!'unique' in Array.prototype){
			Array.prototype.unique = function() {
				var a = this.concat();
				for(var i=0; i<a.length; ++i) {
					for(var j=i+1; j<a.length; ++j) {
						if(a[i] === a[j])
							a.splice(j--, 1);
					}
				}

				return a;
			};
		}
		return a1.concat(a2).unique(); 
	};
	
	$.fn.render = function(template,args,callback)
    {
        return $.jqMVC.render(template,args,callback,this);
    };
	
	$.jqMVC = app;
}(jQuery,NProgress,twig,window));