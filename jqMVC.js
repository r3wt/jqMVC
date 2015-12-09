/*!
 * jqMVC.js (C) 2015 Garrett R Morris, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 * @version 0.3.5
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
        log('using jQuery version '+n.join('.'));
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
        start: function(){},
        stop: function(){}
    };
        
    //view
    var view = {
        render: function(){
            app.done();
            throw 'You must implement a view library to use this feature.';
        }
    };
    
    //model
    var model = {};
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
                log(route);
                var args = [];
                for(var prop in actionList[i].data){
                    args.push(actionList[i].data[prop]);
                }
                var mwStack = {
                    items: route.middleware.slice(),//if we dont clone the array, the stored middleware array will get truncated.
                    halt : function(callback){
                        emit('router.mw.reject');
                        callback.apply(this);
                    },
                    next : function(){
                        emit('router.mw.next');
                        if(mwStack.items.length > 0){
                            mwStack.items.shift().call(this,mwStack);
                        }else{
                            route.callback.apply(this,args);
                        }
                    }
                };
                mwStack.next();
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
    
    function log()
    {
        if (debug) {
            window.console && console.log.apply(this,arguments);
        }
    };
    
    function emit(event,eventData)
    {
        log('jQmv -> emit -> `'+event+'`');
        $(app).trigger(event,eventData);
    };
    
    //end internal utilities
    //everything event related
    var jQselector = $.fn.init,
    jQbound = [],
    evt={};
    $.fn.init = function(selector)
    {
        
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
        $(document).on('submit','form[method][ctrl][action][callback]',function(event){
            //refactor to support file uploads.
            event.preventDefault();
            
            var $this = {};
            $this.el     = $(this);
            $this.method = $this.el.attr('method');
            $this.action = $this.el.attr('action');
            $this.ctrl   = $this.el.attr('ctrl');
            $this.bf     = $this.el.attr('before');
            $this.cb     = $this.el.attr('callback');
            $this.isFile = !!$this.el.find(':input[type="file"]').length;
            
            if($this.isFile){
                $this.data  = new FormData(this);
                $this.type  = false;
                $this.processData = false;
            }else{
                $this.data  = $this.el.serializeObject();
                $this.type  = 'application/x-www-form-urlencoded; charset=UTF-8';
                $this.processData = true;
            }
            
            if(typeof $this.bf === 'function'){
                new Promise(window.ctrl[$this.ctrl][$this.bf])
                .then(function(){
                    formSubmit();
                },function(){
                    //do we do anything else here or just let the before function handle the errors
                });
            }else{
                formSubmit();
            }
            
            log(window,$this);
            
            function formSubmit()
            {
                $this.el.find('button[type="submit"]').prop('disabled',true);
                $.ajax({
                    url: api_path + $this.action,
                    type: ''+$this.method.toUpperCase(),
                    data:  $this.data,
                    contentType: $this.type,
                    cache: false,
                    processData:$this.processData,
                    success: function(data){
                        var data = JSON.parse(data);
                        window.ctrl[$this.ctrl][$this.cb].call( $this.el , data );
                    },
                    error: function(jqXHR, textStatus, errorThrown ){
                        window.ctrl[$this.ctrl][$this.cb].call( $this.el , {'error':1,'message': jqXHR.status +' '+ jqXHR.responseText} );
                    }           
                }).always(function(){
                    $this.el.find('button[type="submit"]').prop('disabled',false);
                });
            
            }
            return false;
        });
    };
    
    evt.bindModel = function()
    {
    
    };
    
    function unbindEvents()
    {
        log('jqMVC -> unbindEvents',jQbound.length + 'events to be removed');
        for(var i=0;i<jQbound.length;i++){
            $(jQbound[i]).find("*").addBack().off();
        }
        jQbound.length = 0;
        clearInterval(router.interval);//if router is using an interval it must be destroyed.
    }
    
    function bindEvents()
    {
        log('jqMVC -> bindEvents',evt);
        for(var c in evt){
            evt[c].apply(this);
        }
    }
    //end events
    //middleware stack
    var stack = {};
    
    stack.items = [];
    
    stack.next = function(){
        log('jqMVC -> middleware -> stack.next()')
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
    
    /**
     * Add a middleware function to the middleware stack. IF called after .run() it does nothing. middleware should accept a single argument, the stack object. when middleware is done doing its work, it should call stack.next()
     * @param {function} middleware - a valid callable accepting the middleware stack object as argument.
     * @returns {object} $.jqMVC
     */
    app.add = function(middleware)
    {
        stack.items.push(middleware);
        return app;
    };
    
    /**
     * Add a global persistent event binding to the event loop. think of it as the SPA equivalent of $(document).ready, as any bindings you add will be executed everytime the app `runs`.the reason for this functionality is that many changes to the document can leave dangling events and delegated events can break etc, so jqMVC keeps track of all bound events and destroys and rebinds them every time that done() is called.
     * @param {string} name - name of the function
     * @param {function} callback - the callback function to execute when the binding is invoked. 
     * @returns {object} $.jqMVC
     */
    app.addBinding = function(name,callback)
    {
        if(binding_override || !evt.hasOwnProperty(name)){
            evt[name] = callback;
        }
        return app;
    };
    
    /**
     * Add a service to the global svc object. services are a great way to write reusable objects and functions and access them from any scope.
     * @param {string} name - the name for the service eg 'foobar' would be accessed svc.foobar()
     * @param {*} mixedvar - an object or callable function are recommended, but a service can be anything.
     * @returns {object} $.jqMVC
     */
    app.addSvc = function(name,mixedvar)
    {
        svc[name] = mixedvar;//services are flexible types.
        return app;
    };
    
    /**
     * Call the internal notify.alert() method, which is set by by setNotification(object)
     * @returns {object} $.jqMVC
     */
    app.alert = function()
    {
        notify.alert.apply(this,arguments);
        return app;
    };
    
    
    /**
     * Calls the internal progress.start() method, which is settable by setProgress(object)
     * @returns {object} $.jqMVC
     */
    app.before = function()
    {
        progress.start();
        return app;
    };
    
    /**
     * Call the internal notify.confirm() method, which is set by by setAlert(object)
     * @returns {object} $.jqMVC
     */
    app.confirm = function()
    {
        notify.confirm.apply(this,arguments);
        return app;
    };
    
    /**
     * Add a controller object to global controller object. controllers are primarily to be used with html bindings, using `ctrl="ctrlname"` semantics. eg `<form ctrl="login" before="loginRequiredParams" callback="loginResult" action="login">` this functionality is not complete and the api will change over time.
     * @param {string} name - the name for the controller eg 'blogPosts' = ctrl.blogPosts
     * @param {object} obj - Controller object
     * @returns {object} $.jqMVC
     */
    app.ctrl = function(name,obj)
    {
        ctrl[name] = obj;
        return app;
    };
    
    /**
     * merge an array of data into the window object. use to define global variables.
     * @param {object} args - properties to create on window object.
     * @returns {object} $.jqMVC
     */
    app.data = function(args)
    {
        for(var prop in args){
            window[prop] = args[prop];
        }
        return app;
    };
    
    /**
     * emits `on.done` event, calls internal progress.start() unbinds all bound events then invokes all bindings.
     * @param {function} [callback]
     * @returns {object} $.jqMVC
     */
    app.done = function(callback)
    {
        emit('on.done');
        progress.stop();
        unbindEvents();
        bindEvents();
        if(typeof callback === 'function'){
            callback.apply(this);
        }
        return app;
    };
    
    /**
     * Navigates to a given route in the application.
     * @param {string} url - the url to navigate to.
     * @example $.jqMVC.go('/user/logout');
     * @returns {object} $.jqMVC
     */
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
    
    /**
     * creates a dependency loading middleware to run at startup. accepts an array of scripts to load. to configure the directory to load from set module_path to your desired location. relative paths only. uses ES6 promises.
     * @param {array} modules - the array of scripts to load
     * @returns {object} $.jqMVC
     * @example $.jqMVC.loadModules(['routes.js','controllers.js','models.js']);
     */
    app.loadModules = function(modules){
        if(modules.length > 0){
            app.add(function(stack){
                function loadScript(url) {
                    var scriptPromise = new Promise(function(resolve, reject) {
                        var script = document.createElement('script');
                        script.src = url;
                        script.addEventListener('load', function() {
                            resolve(url);
                        }, false);
                        
                        script.addEventListener('error', function() {
                            reject(url);
                        }, false);
                        document.body.appendChild(script);
                    });
                    return scriptPromise;
                }
    
                new Promise(function(resolve, reject) {
                    //load All scripts
                    var returned = 0,
                    state={};
                    for(var i=0;i<modules.length;i++){
                        loadScript(getPath() + module_path + modules[i]) 
                        .then(
                            function(){
                                returned++;
                                $(state).trigger('check');
                            },
                            function(){
                                returned++;
                                $(state).trigger('check');
                            }
                        );
                    }
                    $(state).on('check',function(){
                        if(returned >= modules.length){
                            resolve();
                        }
                    });
                    //todo add safeguard polling to reject promise after certain time?
                    //or find a better way.
                }).then(stack.next,stack.next);
            });
        }
        return app;
    };
    
    /**
     * binds an event listener to $.jqMVC. Should be noted that events bound on $.jqMVC are not garbage collected, so be mindful of binding with listen inside of route closures.
     * @param {string} event - name of event to listen for
     * @param {function} callback - the callback to bind for this event.
     * @returns {object} $.jqMVC
     */
    app.listen = function(event,callback)
    {
        $(app).bind(event,callback);
        return app;
    };
    
    /**
     * Add a one time event listener to $.jqMVC. recommended use case is inside of route closures, listening for `on.before.go` and destroying things the framework cant destroy, like plugin instances.
     * @param {string} name - the name for the service eg 'foobar' would be accessed svc.foobar()
     * @param {function} callback - the callback to bind for this event. 
     * @returns {object} $.jqMVC
     */
    app.listenOnce = function(event,callback)
    {
        $(app).one(event,callback);
        return app;
    };
    
    /**
     * Merge 2 or more arrays and return the value. currently used by internal utilities, and maybe deprecated.
     * @param {array} array1 - an array
     * @param {array} array2 - an array
     * @param {array} [array3] - and so on and so forth.
     * @returns {array} result of merging the arrays.
     */
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
    
    /**
     * define a model object
     * @param {string} name - the name of the model
     * @param {object} obj - the model
     * @returns {object} $.jqMVC
     */
    app.model = function(name,obj){
        model[name] = obj;
        return app;
    };
    
    /**
     * define a route object path Note: Any arguments between first and last argument of the function are treated as middleware.Middleware should accept a stack argument. stack has two functions, next and halt(callback). if halt is called the route closure is not invoked. therefore to continue execution, you must define some behavior in the callback provided to halt, such as triggering a notFound error, or redirecting to another page with go() showing a permissions error screen etc.
     * @param {string} path - use `:name` for placeholders
     * @param {function} callback - the route closure.
     * @example $.jqMVC.path('/posts/:title/:id',function(title,id){ //your code here });
     * @example $.jqMVC.path(path,middleware1,middleware2,callback);
     * @returns {object} $.jqMVC
     */
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
    
        routeList.push({
            route: route,
            middleware: middleware,
            callback: callback,
            type: isRegExp ? "regexp" : "string",
        });
        return app;
    };
    
    /**
     * calls internal view.render method with all arguments passed. view is set via setView
     * @returns {object} $.jqMVC
     */
    app.render = function()
    {
        view.render.apply(this,arguments);
        return app;
    };
    
    /**
     * runs the app for the first time, then overwrites run so it cant be called again. executes all middleware, including the app itself. no params and no return value.
     */
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
    };
    
    /**
     * set the internal model Object.
     * @param {object} obj - model object for the app to use.
     * @returns {object} $.jqMVC
     */
    app.setModel = function(obj)
    {
        model = obj;
        return app;
    };
    
    /**
     * set the internal notification Object.
     * @param {object} obj - the notification object for the app to use. default object just calls alert() and confirm() builtins with arguments.
     * @returns {object} $.jqMVC
     */
    app.setNotification = function(obj)
    {
        notify = obj;
        return app;
    };
    
    /**
     * set the internal progress Object.
     * @param {object} obj - the progress object for the app to use. default object does nothing in either start() or stop() functions.
     * @returns {object} $.jqMVC
     */
    app.setProgress = function(obj)
    {
        progress = obj;
        return app;
    };
    
    /**
     * set the internal view Object.
     * @param {object} obj - the view object for the app to use only builtin method is render() and the default method throws and emits `viewError` event.
     * @returns {object} $.jqMVC
     */
    app.setView = function(obj)
    {
        view = obj;
        return app;
    };
    
    /**
     * trigger an event on $.jqMVC
     * @param {string) event - the event to trigger
     * @param {object} [eventData] - optional event data to pass to event.
     * @returns {object} $.jqMVC
     */
    app.trigger = function(event,eventData)
    {
        emit(event,eventData);
        return app;
    };
    //set default app settings
    app.data({
        app_path    : window.location.origin,
        api_path    : '/api/',
        view_path   : '/views',
        module_path :'/modules',
        model_path  : '/models',
        element     : $('body'),
        debug       : false,
        binding_override: false,
    });
    
    $.jqMVC = app;//expose jqMVC
}(jQuery,window,document));