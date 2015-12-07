/*!
 * jqMVC.js (C) 2015 Garrett R Morris, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 * @version 0.3.0
 * router contains heavily modified code originally written by camilo tapia https://github.com/camme/jquery-router-plugin
 */
;!(function($,window,document){
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
    
    
    
    //notifications
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
    
    //progress
    var progress = {
        start: function(){
            
        },
        stop: function(){
        }
    };
        
    //view
    var view = {
        render: function(){
            app.done();
            throw 'You must implement a view with `setView()` before you can render templates';
        }
    };
    
    //model
    var model = {
        
    };
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
    
    function setter(obj,prop,ret){
          if(!obj.hasOwnProperty(prop)){
          obj[prop] = {};
        }
        return function(name,mixedvar){
          obj[prop][name] = mixedvar;
          return ret;
        };
    }
    
    function getPath()
    {
        var path = app_path.replace(window.location.origin,'').replace(/\/+/g, '/').trim('/');//possibly unsafe.
        if(path.length === 0){
            path +='/';
        }
        return path;
    }
    
    function checkRoutes()
    {
        var currentUrl = parseUrl(location.pathname);
        // check if a route exists.
        var actionList = getParameters(currentUrl);
        if(actionList.length === 0){
            emit('notFound');
        }else{
            for(var i = 0; i < actionList.length; i++)
            {
                var route = actionList[i];
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
                    var obj = (function(){ return route; }());
                    obj.data = {matches: result};
                    dataList.push(obj);
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
                        var obj = (function(){ return route; }());
                        obj.data = data;
                        dataList.push(obj);
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
    
    //end internal utilities
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
    //middleware stack
    var stack = {};
    
    stack.items = [];
    
    stack.next = function(){
        stack.items.shift().call($,stack);
    };
    //end middleware stack
    //router
    var hasPushState = (history && history.pushState);    
    var hasHashState = !hasPushState && ("onhashchange" in window) && false;
    var routeList = [];
    var eventAdded = false;
    var currentUsedUrl = location.href;
    var firstRoute = true;
    var firstRun = false;
    var router = {};
    
    router.interval = null;
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
    //endrouter
    var app = {};
    
    app.add = function(callable){
        stack.items.push(callable);
        return app;
    };
    
    app.addBinding = function(name,callback)
    {
        if(binding_override || !evt.hasOwnProperty(name)){
            evt[name] = callback;
        }
        return app;
    };
    
    app.addSvc = function(name,mixedvar,retval)
    {
        window.svc[name] = mixedvar;//services are flexible types.
        return app;
    };
    
    app.alert = function()
    {
        notify.alert.apply(this,arguments);
        return app;
    };
    
    app.before = function()
    {
        progress.start();
        return app;
    };
    
    app.confirm = function()
    {
        notify.confirm.apply(this,arguments);
        return app;
    };
        
    app.ctrl = function(name,object)
    {
        window.ctrl[name] = object;
        return app;
    };
    
    
    app.data = function(args)
    {
        for(var prop in args){
            window[prop] = args[prop];
        }
        return app;
    };
    
    app.done = function()
    {
        emit('on.done');
        progress.stop();
        unbindEvents();
        bindEvents();
        return app;
    };
    
    app.go = function(url)
    {   
        if (hasPushState) {
            history.pushState({}, null, url);
            checkRoutes();
            if(!eventAdded){
                evt.bindRouter();
            }
        } else {
            if(!eventAdded){
                evt.bindRouter();
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
    
    app.listen = function(event,callback)
    {
        $(app).bind(event,callback);
        return app;
    };
    
    app.listenOnce = function(event,callback)
    {
        $(app).one(event,callback);
        return app;
    };
    
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
    
    app.render = function()
    {
        view.render.apply(this,arguments);
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
    
    app.setNotifications = function(obj){
        notify = obj;
        return app;
    };
    
    app.setProgress = function(obj){
        progress = obj;
        return app;
    };
    
    app.setView = function(obj)
    {
        view = obj;
        return app;
    };
    
    app.trigger = function(event,eventData){
        emit(event,eventData);
        return app;
    };
    //set default app settings
    app.data({
        app_path  : window.location.origin,
        api_path  : '',
        view_path : '/', 
        element : $('body'),
        debug : false,
        binding_override: false,
    });
    
    $.jqMVC = app;//expose jqMVC
}(jQuery,window,document));