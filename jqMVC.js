/*!
 * jqMVC.js (C) 2015 jqMVC.js Developers, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 * @version 0.1.2
 * contains heavily modified code originally written by camilo tapia https://github.com/camme/jquery-router-plugin
 */

;!(function($){

    // you no touchy
    var app = {};
    
    // fix for browsers that dont have location.origin
    if (!window.location.origin) {
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    }
    
    // random shit, probably deprecated eventually
	var controller = null;
    
    //internal utilities
    
    function getPath()
    {
        if(window.hasOwnProperty('app_path')){
            return app_path.replace(/\/+/g, '/');//possibly unsafe.
        }
        return '/';
    }
    
    function bindStateEvents()
    {
        eventAdded = true;

        // default value telling router that we havent replaced the url from a hash. yet.
        router.fromHash = false;

        if (hasPushState) {
            if (location.hash.indexOf("#!/") === 0) {
                // replace the state
                var url = location.pathname + location.hash.replace(/^#!\//gi, "");
                history.replaceState({}, "", url);
                router.fromHash = true;
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
    
    function checkRoutes()
    {
        var currentUrl = parseUrl(location.pathname);
        // check if a route exists.
        var actionList = getParameters(currentUrl);
        console.log(actionList);
        if(actionList.length === 0){
            emit('notFound');
        }else{
            for(var i = 0; i < actionList.length; i++)
            {
                var route = actionList[i].route;
                var args = [];
                for(var prop in actionList[i].data){
                    args.push(actionList[i].data[prop]);
                }
                if(typeof route.callback !== 'function' && route.callback.isArray()){
                    for(var j=0;j<route.callback.length;j++){
                        if(j==route.callback.length - 1){
                            //last callback is always the route function
                            route.callback[j].apply(this,args);
                        }else{
                            //just a middleware.
                            var result = route.callback[j].apply(this);
                            if(typeof result !== "undefined"){
                                break;//halt execution
                                // reasonable to assume that the middleware has 
                                // already continued executing some new path.
                                
                            }
                        }
                    }
                }else{
                    route.callback.apply(this,args);
                }
            }   
        }
    };
    
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
                        router.currentParameters = data;
                        break; 
                    }
                }
            }
        }

        return dataList;
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
		$(document).on('click','a[data-href]',function(e){
            e.preventDefault();
            emit('before.go');
            app.go( getPath().replace(/\/+$/, '')+$(this).data('href') ,'Loading');
            return false;
        }); 
    };
    
    //end internal utilities
    
    //router
    var hasPushState = (history && history.pushState);    
    var hasHashState = !hasPushState && ("onhashchange" in window) && false;
    var routeList = [];
    var eventAdded = false;
    var currentUsedUrl = location.href;
    var firstRoute = true;
    var firstRun = false;
    var router = {};
    
    router.currentId = "";
    router.currentParameters = {};
    
    router.capabilities = {
        hash: hasHashState,
        pushState: hasPushState,
        timer: !hasHashState && !hasPushState
    };
    
    router.checkRoute = function(url) 
    {
        return getParameters(parseUrl(url)).length > 0;
    };
    
    // get the current parameters for either a specified url or the current one if parameters is ommited
    router.parameters = function(url)
    {
        // parse the url so that we handle a unified url
        var currentUrl = parseUrl(url);

        // get the list of actions for the current url
        var list = getParameters(currentUrl);

        // if the list is empty, return an empty object
        if (list.length == 0) {
            router.currentParameters = {};
        } else {
            router.currentParameters = list[0].data;// if we got results, return the first one. at least for now
        }

        return router.currentParameters;
    };
    
    app.path = function()
    {
        var args = [];
        Array.prototype.push.apply( args, arguments );
        var route = args.shift(); //first arg is always the path
        var callback = args.pop(); //last arg is the callback
        var middleware = args; //safe to assume remaining arguments are middleware
        
        route = getPath().replace(/\/+$/, '') + route;
        var isRegExp = typeof route == "object";

        if (!isRegExp) {
            // remove the last slash to unifiy all routes
            if (route.lastIndexOf("/") == route.length - 1) {
				route = route.substring(0, route.length - 1);
            }
            // if the routes were created with an absolute url ,we have to remove the absolute part
            route = route.replace(location.protocol + "//", "").replace(location.hostname, "");
        }
        
        var obj = {};
        
        if(middleware.length > 0){
            obj.callback = middleware;
            obj.callback.push(callback);
        }

        routeList.push({
            route: route,
            callback: callback,
            type: isRegExp ? "regexp" : "string",
        });
        return app;
    };
    //endrouter
    
    //middleware stack
    var stack = {};
    
    stack.items = [];
    
    stack.next = function(){
        stack.items.shift().call($,stack);
    };
    
    app.add = function(callable){
        stack.items.push(callable);
        return app;
    };
    
    app.run = function()
    {
        if(!firstRun){
            emit('firstRun');
            firstRun = true;
            app.add(function(){
                app.go(location.href);
            });
            stack.next();
        }
        app.run = function(){};
        return app;
    };
    //end middleware stack
    
    
    //event related
    
    app.trigger = function(event,eventData){
        emit(event,eventData);
        return app;
    };
    
    app.listen = function(event,callback)
    {
        $(app).bind(event,callback);
        return app;
    };
    
    //end event related
    
    app.loadModule = function(path){
        var path = window.location.origin + getPath() +  module_path + path;
        var s = document.createElement('script');
        s.setAttribute('src', path);
        s.className = 'jqMVCmodule';
        s.async = true;
        s.onload = function(){};
        document.body.appendChild( s );
        return app;
    };

    app.go = function(url)
    {   
        if (hasPushState) {
            history.pushState({}, null, url);
            checkRoutes();
            if(!eventAdded){
                bindStateEvents();
            }
        } else {
            if(!eventAdded){
                bindStateEvents();
            }
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
    
    app.data = function(args)
    {
        for(var prop in args){
            window[prop] = args[prop];
        }
        return app;
    };

    app.clean = function()
    {

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
        var path = window.location.origin + getPath() + ctrl_path + path;
        app.clean();
        var s = document.createElement('script');
        s.setAttribute('src', path);
        s.className = 'jqMVCctrl';
        var z = null;
        s.onload = function(){
            emit('on.controller');
            z = $ctrl;
            z.invoke();
        };
        controller = z;
        document.body.appendChild( s );
        return app;
    };
	
	// services
	window.svc = {};

    app.addSvc = function(name,mixedvar)
    {
        window.svc[name] = mixedvar;//services are flexible types.
        return app;
    };
	// end services
    
    // merge infinite number of arrays.
    app.merge = function(){
        var args = [],
        result = [],
        unique = function(a,b) {
            var a = a.concat(b);
            for(var i=0; i<a.length; ++i) {
                for(var j=i+1; j<a.length; ++j) {
                    if(a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        };
        Array.prototype.push.apply(args,arguments);
        for(k=0;k<args.length;k++){
            result = unique(result,args[k]);
        }
        return result; 
    };
    
    //notificatins related
    var notify = {
        alert:function(message){
            alert(message);
        },
        confirm:function(message,callback){
            if(confirm(message)){
                callback.apply(this);
            }
        }
    };
    
    app.setNotifications = function(obj){
        notify = obj;
        return app;
    };
    
    app.alert = function()
    {
        notify.alert.apply(this,arguments);
        return app;
    };
    
    app.confirm = function()
    {
        notify.confirm.apply(this,arguments);
        return app;
    };
    
    
    //progress related
    var progress = {
        start: function(){
            
        },
        stop: function(){
        }
    };
    
    app.setProgress = function(obj){
        progress = obj;
        return app;
    }
    
    app.before = function()
    {
        progress.start();
        return app;
    };

    app.done = function()
    {
        emit('on.done');
        progress.stop();
        bind_href();
        return app;
    };
    
    //all view related functions here
    var view = {
        render: function(){
            app.done();
            throw 'You must implement a view with `setView()` before you can render templates';
        }
    };
    
    app.setView = function(obj){
        view = obj;
        return app;
    };
    
    app.render = function()
    {
        view.render.apply(this,arguments);
    };
    
    $.jqMVC = app;
}(jQuery));