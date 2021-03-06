/**
 * jqMVC - The jQuery MVC Framework
 *
 * @version   0.6.1
 * @link      https://github.com/r3wt/jqMVC
 * @copyright (c) 2015 - 2016 Garrett R. Morris
 * @license   https://github.com/r3wt/jqMVC/blob/master/LICENSE (MIT License)
 * @build     2016-05-04_19:39:19 UTC
 * contains 3rd party code:
 * jQuery.serializeObject() - Copyright (c) 2013 David Hong - https://github.com/hongymagic/jQuery.serializeObject
 * touch events by cocco - http://stackoverflow.com/a/17567696/2401804
 */
!(function($,window,document){
    var app = {},
        routeList = [],
        eventAdded = false,
        currentUsedUrl = location.href,
        firstRoute = true,
        firstRun = false,
        router = {},
        notify = {
            alert:function(){},
            confirm:function(){}
        },
        progress = {
            start: function(){},
            stop: function(){}
        },
        view = {},
        model = {},
        stack = {},
        jQselector = $.fn.init,
        jQbound = [],
        evt={},
        evtOnce = [],
        jobs={},
        destructors = [],
        workers={};
    
        /* define things are exposed */
        window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
        window.ctrl = {};
        window.svc = {};
        window.models = {};
        window.workers = {};
    
        /* define default global settings that the app uses*/
        window.app_path         = '/';
        window.api_path         = '/api/';
        window.view_path        = '/views';
        window.module_path      ='/modules';
        window.element          = $('body');
        window.debug            = false;
        window.binding_override = false;
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
    
    function canRun()
    {
        var can = true,
        reason = {};
        if(!(history && history.pushState)){
            can = false;
            reason.router = 'Browser Does not support History API';
        }
        if((!window.URL.createObjectURL) || typeof Worker === "undefined"){
            can = false;
            reason.worker = 'Browser Does not support Webworkers';
        }
        return (!can) ? reason : true;
    }
    
    function log()
    {
        if (debug) {
            /* jshint ignore:start */
            window.console && console.log.apply(console,arguments);
            /* jshint ignore:end */
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
    
    function jobPending()
    {
        for(var job in jobs){
            //called by the system before navigation to temporarily suspend jobs.
            //therefore we make sure a job isnt paused so it wont be resumed after app.done() is called
            safelyStopJob(job,0);
        }   
    }
    
    function safelyStopJob(job,newState)
    {
        if(jobs[job].state !== 3){
            jobs[job].state = newState;
        }
        clearInterval(jobs[job].timer);
        if(newState == -1){
            delete jobs[job];
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
            if(jobs[job].state !==3 || targets == '*'){
                safelyStopJob(job,0);
                var thisJob = jobs[job];
                thisJob.state = 1;
                thisJob.timer = setInterval(thisJob.payload,thisJob.interval);
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
            if(jobs.hasOwnProperty(targets)){
                safelyStopJob(targets,-1);
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
        return t;
    }
    
    function xssFilter(a)
    {
        var b = decodeURIComponent(a).replace(/<script([^'"]|"(\\.|[^"\\])*"|'(\\.|[^'\\])*')*?<\/script>/g,'').split(''),
            c = [],
            d  = 0,
            e = 0;
        for( i=0; i < b.length; i++ ){
            switch( b[i] + d + e ){
                case "<00": 
                    d = 1; 
                break;
                case ">10" : 
                    d = 0; 
                    c.push(' '); 
                break;
                case '"10': 
                    e = 1; 
                break;
                case "'10": 
                    e = 2;
                break;
                case '"11': 
                case "'12": 
                    e = 0;
                break;
                default: 
                    if(!d){
                        c.push(b[i]); 
                    }
                break;
            }
        }
        return c.join('');
    }
    
    function loadScript(url,callback,error,modify) 
    {
        var script = document.createElement('script');
        script.src = url;
        script.addEventListener('load',callback, false);
        script.addEventListener('error',error, false);
        if(typeof modify === 'function'){
            modify(script);//pass script to modify to allow it to be edited
        }
        document.body.appendChild(script);
    }
    //override fn.init of jQuery so we can track selectors with bound event handlers.
    $.fn.init = function(selector,context)
    {
        
        var trackSelector =  isDefined(selector) && !isApp(selector) && (( isString(selector) || isWindow(selector) || isDocument(selector) ) !== false);
        
        var jQinstance = new jQselector(selector,context||window.document,$);
        
        // we only track events bound on element(s), document, and window. 
        // events bound on plain objects such as those that are bound with 
        // $.jqMVC.listen and $.jqMVC.listenOnce are NOT tracked. #87
        if(trackSelector){
            jQbound = app.merge(jQbound,[selector]);//to prevent dupes in jqBound
        }
    
        return jQinstance;
    };
    
    // jQuery.serializeObject() - Copyright (c) 2013 David Hong
    // https://github.com/hongymagic/jQuery.serializeObject
    $.fn.serializeObject=function(){"use strict";var a={},b=function(b,c){var d=a[c.name];"undefined"!=typeof d&&d!==null?$.isArray(d)?d.push(c.value):a[c.name]=[d,c.value]:a[c.name]=c.value};return $.each(this.serializeArray(),b),a};
    //end jQuery.serializeObject()
    
    //like jQuery.data() but specifically for jqMVC's namespaced html attributes.
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
    
    function getController(t)
    {
        var c = t.closest('[jq-ctrl]');
        
        if(c.length > 0){
            return window.ctrl[c.jq('ctrl')] || false;
        }else{
            return window.ctrl;//no controller is set. assume they will use controller.method ie `foobar.SomeFunc`
        }
    }
    
    //this function simply resolves a binding to its controller, if it exists.
    //t = $(element)
    //c = string controller method OR controller name . method
    //ex `jq-ctrl="fooController" jq-unload="barMethod"` OR `jq-unload="fooController.barMethod"`
    function resolve(t,c)
    {
        var d = getController(t);
        if(d !== false){
            return d[t.jq(c)];
        }else{
            return eval('window.ctrl.'+t.jq(c));//nasty!
        }
    }
    
    evt.bindDefaults = function()
    {
        //default html bindings.
        
        /***
          * blocked
          * jq-subview= example <div jq-view="template,apiCall,apiArgs"></div>
          * jq-observe= observe mutation of element.
          */
        
        
        if(!eventAdded){
            //author `cocco` @ http://stackoverflow.com/a/17567696/2401804
            (function(d){
                var ce=function(e,n){
                    var a=document.createEvent("CustomEvent");
                a.initCustomEvent(n,true,true,e.target);
                    e.target.dispatchEvent(a);
                    a=null;
                    return false;
                },
                nm=true,
                sp={x:0,y:0},
                ep={x:0,y:0},
                touch={
                    touchstart:function(e){
                        sp={x:e.touches[0].pageX,y:e.touches[0].pageY};
                    },
                    touchmove:function(e){
                        nm=false;
                        ep={x:e.touches[0].pageX,y:e.touches[0].pageY};
                    },
                    touchend:function(e){
                        if(nm){
                            ce(e,'fc');
                        }else{
                            var x=ep.x-sp.x,
                            xr=Math.abs(x),
                            y=ep.y-sp.y,
                            yr=Math.abs(y);
                            if(Math.max(xr,yr)>20){
                                ce(e,(xr>yr?(x<0?'swl':'swr'):(y<0?'swu':'swd')));
                            }
                        }
                        nm=true;
                    },
                    touchcancel:function(e){
                        nm=false;
                    }
                };
                for(var a in touch){
                    d.addEventListener(a,touch[a],false);
                }
            }(document));
            //end taken from stackoverflow.
            eventAdded = true;
        }
        
        
        /*
        jq-swipe-left = on swipe left. (touch device only)
        jq-swipe-right = on swipe right. (touch device only)
        jq-swipe-up = on swipe up only.
        jq-swipe-down = on down only.
        jq-fast-click  = fastclick
        */
    
        $.each({
            swr: 'swipe-right',
            swl: 'swipe-left',
            swu: 'swipe-up',
            swd: 'swipe-down',
            fc:  'fast-click'
        },function(k,v){
            $('[jq-'+v+']').each(function(){
                $(this).on( k, resolve( $(this), v) );
            });
        })
        
        $.each([
            'click',
            'dblclick',
            'mousedown',
            'mouseup',
            'keydown',
            'keypress',
            'keyup',
            'change',
            'scroll',
            'dragstart',
            'dragstop',
            'error'
        ],function(k,v){
            $('[jq-'+v+']').each(function(){
                $(this).on( v , resolve( $(this), v ) );
            });
        });
        
        //jq load/unload
        $('[jq-load]').each(function(i,v){
            resolve( $(this), 'load' ).apply(this);
        });
        $('[jq-unload]').each(function(i,v){
            app.unload( resolve( $(this) , 'unload' ) );//because aliens.
        });
        
        $(document).on('submit','form[jq-method][jq-action][jq-callback]',function(event){
            //refactor to support file uploads.
            event.preventDefault();
            
            var $this = {};
            $this.el     = $(this);
            $this.method = $this.el.jq('method');
            $this.action = $this.el.jq('action');
            $this.bf     = $this.el.jq('before');
            $this.cb     = $this.el.jq('callback');
            $this.isFile = !!$this.el.find(':input[type="file"]').length;
            
            var controller = getController($this.el);
            
            if($this.isFile){
                $this.data  = new FormData(this);
                $this.type  = false;
                $this.processData = false;
            }else{
                $this.data  = $this.el.serializeObject();
                $this.type  = 'application/x-www-form-urlencoded; charset=UTF-8';
                $this.processData = true;
            }
            
            if(typeof $this.bf !== 'undefined'){
                new Promise(function(resolve,reject){
                    controller[$this.bf]($this,resolve,reject);
                }).then(function(){
                    formSubmit();
                },function(){
                   
                });
            }else{
                formSubmit();
            }
            
            function formSubmit()
            {
                $this.el.find('button[type="submit"]').prop('disabled',true);
                $.ajax({
                    url: api_path + $this.action,
                    type: $this.method.toUpperCase(),
                    data:  $this.data,
                    contentType: $this.type,
                    cache: false,
                    processData:$this.processData,
                    success: function(data){
                        data = JSON.parse(data);
                        controller[$this.cb].call( $this.el , data );
                    },
                    error: function(jqXHR, textStatus, errorThrown ){
                        controller[$this.cb].call( $this.el , {'error':1,'message': jqXHR.status +' '+ jqXHR.responseText} );
                    }           
                }).always(function(){
                    $this.el.find('button[type="submit"]').prop('disabled',false);
                });
            
            }
            return false;
        });
        
        //jq-href
        $(document).on('click','[jq-href]',function(e){
            e.preventDefault();
            emit('before.go');
            app.go( $(this).jq('href') ,'Loading');
            return false;
        });
        
        //router
        $(window).bind("popstate", router.popstate);
        
        //jq-resize
        (function(){
            var a = [];
            $('[jq-resize]').each(function(i,v){
                var fn = resolve( $(this), 'resize' );
                a.push( fn );
                log(a.length);
                log(fn);
            });
            $(window).resize(function(){
                $.each(a,function(i,v){ v.apply(window); });
            });
        }());
        
    };
    
    
    
    function unbind()
    {
        log('jqMVC -> unbind');
        for(var i=0;i<destructors.length;i++){
            destructors[i].call(this);
        }
        destructors.length = 0;
        for(var i=0;i<jQbound.length;i++){
            $(jQbound[i]).find("*").addBack().off();
        }
        jQbound.length = 0;
    }
    
    function bind()
    {
        log('jqMVC -> bind');
        for(var ev in evt){
            var c = evt[ev];
            if(typeof c === 'function'){
                c.apply(this);
            }
        }
        for(var i=0;i<evtOnce.length;i++){
            var c = evtOnce[i];
            if(typeof c === 'function'){
                c.apply(this);
            }
        }
        evtOnce.length = 0;
    }
    //end events
    stack.items = [];
    stack.next = function()
    {
        log('jqMVC -> middleware -> next()');
        stack.items.shift().call($,stack);    
    };
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
        //normalize, keeping query string in order to satisfy history api with correct route
        url = router.normalize(url,true);
        history.pushState({}, null, url);
        //in checkRoutes, normalize will run again, this time stripping querystring. 
        router.checkRoutes();
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
                    var data = {},
                        matchCounter = 0;
    
                    for(var j = 0; j < routeParts.length; j++) {
                        if (routeParts[j].indexOf(":") === 0) {
                            //its a parameter
                            data[routeParts[j].substring(1)] = xssFilter(currentUrlParts[j]);
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
    if(typeof Worker !== 'undefined'){
        Worker.createURL = function(c)
        {
            var str = (typeof c === 'function')?c.toString():c;
            var blob = new Blob(['\'use strict\';\nself.onmessage ='+str], { type: 'text/javascript' });
            return window.URL.createObjectURL(blob);
        };
    
        Worker.create = function(c)
        {
          return new Worker(Worker.createURL(c));
        };    
    }
    
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
     * Add a global persistent event binding to the event loop. think of it as the SPA equivalent of $(document).ready, as any bindings you add will be executed everytime the app `runs`.the reason for this functionality is that many changes to the document can leave dangling events and delegated events can break etc, so jqMVC keeps track of all bound events and destroys and rebinds them every time that done() is called.
     * @param {string} name - name of the function
     * @param {function} callback - the callback function to execute when the binding is invoked. 
     * @returns {object} $.jqMVC
     */
    app.bind = function(name,callback)
    {
        if(binding_override || !evt.hasOwnProperty(name)){
            evt[name] = callback;
        }
        return app;
    };
    
    /**
     * Add a onetime event binding. bindOnce's payload doesnt execute until the default bindings have been bound, providing consistent behavior to the app. bindOnce functions are destroyed after payload execution.
     * @param {function} callback - the callback function to execute when the binding is invoked. 
     * @returns {object} $.jqMVC
     */
    app.bindOnce = function(callback)
    {
        evtOnce.push(callback);
        return app;
    };
    
    /**
     * Dumps Information about the framework/environment.
     * @returns {object} { routes, bindings, controllers, services, models, jobs }
     */
    app.debug = function(){
        return {
            routes:routeList,
            bindings:evt,
            controllers: ctrl,
            services: svc,
            models: models,
            jobs: jobs,
        };
    };
    
    /**
     * resolve a string as a function at runtime. useful to prevent undefined errors because of racing modules that might reference a variable that isnt defined *yet*
     * @example $.jqMVC.callableResolver('ctrl.middleware.isUserLoggedIn');
     * @param {string} c - any valid callable as a string , eg `fooBar` or `ctrl.fooBar.baz` or `svc.fooBar`
     * @returns {function} callableResolver
     */
    app.callableResolver = function(c)
    {
        return function(){ 
            var args = arguments;
            return eval(c+'.apply(this,args)'); 
        };
    };
    
    /**
     * Call the internal notify.confirm() method, which is set by by setNotification(object)
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
     * emits `on.done` event, calls internal progress.start() unbinds all bound events then invokes all bindings,resumes jobs. this function must be called somewhere in a route closure.
     * @param {function} [callback]
     * @returns {object} $.jqMVC
     */
    app.done = function()
    {
        progress.stop();
        unbind();
        bind();
        jobResume();//resume all non-paused jobs.
        emit('on.done');
        throw 'accept';
    };
    
    /**
     * Navigates to a given route in the application.
     * @param {string} url - the url to navigate to.
     * @example $.jqMVC.go('/user/logout');
     * @returns {object} $.jqMVC
     */
    app.go = function(url)
    {   
        jobPending();//halt all jobs.
        router.go(url);
        return app;
    };
    
    /**
     * Creates a route group. `$.jqMVC.route()` routes created in this closure will be prefixed with the provided prefix. RegExp routes will have their RegExp object modified to include prefix as well. nested groups are supported, but tentatively discouraged.
     * @param {string} prefix - the route prefix
     * @param {function} [groupMiddleware] - (optional) middleware for any route declared in the group.
     * @param {function} groupCallback - the group callback function. 
     * @example $.jqMVC.group('/users',function(){  //all routes here will be prefixed });
     * @returns {object} $.jqMVC
     */
    app.group = function(prefix,groupMiddleware,groupCallback)
    {
        if(typeof groupMiddleware === 'function' && typeof groupCallback === 'undefined')
        {
            //no middleware provided
            groupCallback = groupMiddleware;
            groupMiddleware = null;
        }
        
        if(typeof prefix !== 'string'){
            throw 'prefix must be a string';
        }
        
        var routeFunction = app.route;
        
        app.route = function()
        {
            var args = [];
            Array.prototype.push.apply( args, arguments );
            var route = args.shift(); //first arg is always the path
            
            //its a bit more difficult here. we need to ensure its not a regexp, and if it is we need to merge the expressions.
            if(route instanceof RegExp){
                route = route.toString().substr(1);//remove regexp literal "/"
                
                //to get the flags, we can split at "/"
                var flags = '';
                if(route.substr(-1) !== '/'){
    
                    route = route.split('/');
    
                    flags = route.pop();
    
                    route = route.join('/');
    
                }else{
                    route = route.substr(0, route.length - 1);
                }
                
                route = escapeRegExp(prefix) + route;
                
                route = new RegExp(route,flags);
            }else{
                route = prefix + route;
            }
            
            var callback = args.pop(); //last arg is the callback
            var middleware = args; //safe to assume remaining arguments are middleware
            
            if(groupMiddleware !== null){
                middleware = app.merge([groupMiddleware],middleware);//make sure groupMiddleware is always first
            }
            
            var args2 = app.merge([route],middleware,[callback]);
            routeFunction.apply(this,args2);
            return app;
        };
        
        groupCallback.apply(this);
        
        app.route = routeFunction;
        
        return app;
    };
    
    /**
     * Router Control Function - Used to halt the router. accepts a callback function as a parameter. you should continue execution in this callback, ie redirecting to a new route, showing an error, whatever it is.
     * @returns {object} $.jqMVC
     */
    app.halt = function(callback){
        log('jqMVC -> router -> route -> mw -> reject');
        if(typeof callback === 'function'){
            callback.apply(this);
        }
        throw 'halt';
    };
    
    /**
     * creates a dependency loading middleware to run at startup. accepts an array of scripts to load. to configure the directory to load from set module_path to your desired location. relative paths only. uses ES6 promises.
     * @param {array} modules - the array of scripts to load
     * @returns {object} $.jqMVC
     * @example $.jqMVC.loadModules(['routes.js','controllers.js','models.js']);
     */
    app.loadModules = function(modules)
    {
        if(modules.length > 0){
            app.add(function(stack){
                //load All scripts
                var returned = 0;
                var stateCheck = function(){
                    returned +=1;
                    if(returned == modules.length){
                        stack.next();
                    }
                };
                    
                for(var i=0;i<modules.length;i++){
                    loadScript(app.path + module_path + modules[i],stateCheck,stateCheck);
                }
                
                
            });
        }
        return app;
    };
    
    /**
     * this variant of loadModules loads a single module, then executes a callback. intended to be used with modules associated only with a specific route or routes. callback must be supplied to ensure script is loaded before events are bound.
     * @param {string} module - the name of the module to load
     * @param {function} callback - the required callback function
     * @param {function} error
     * @returns {object} $.jqMVC
     * @example $.jqMVC.loadOnce('users.js',function(){ //do stuff });
     */
    app.loadOnce = function(module,callback,error)
    {
        if($('script[src="'+file+'"][jq-loadonce]').length){
            $('script[src="'+file+'"][jq-loadonce]').remove();
        }
        loadScript(app.path + module_path + module,callback,error,function(script){
            script.setAttribute('jq-loadonce','1');
        });
        return app;
    };
    
    
    /**
     * call an action on a job
     * @param {string} action - action to call on job. valid options are `pause`,`destroy`,`inspect` and `resume`
     * @param {string} name - name of job. use `"*"` to target all jobs
     * @returns {object} $.jqMVC - <strong>NOTE:</strong> <em>if inspect action is called, this function returns either the jobs object or a single job object.
     */
    /**
     * allows for creation of periodic execution of a payload function, with management states and api for pausing,destroying etc.
     * @param {string} name - name to assign job
     * @param {function} payload - the payload to execute
     * @param {integer} interval - how often to execute the job.
     * @returns {object} $.jqMVC
     */
    app.job = function()
    {
        switch(arguments.length){
            case 3:
                jobs[arguments[0]] = {
                    state: 0,
                    payload: arguments[1],
                    interval: timeParse(arguments[2]),
                    timer: null
                };
            break;
            case 2:
                switch(arguments[0]){
                    case 'pause':
                        jobPause(arguments[1]);
                    break;
                    case 'destroy':
                        jobDestroy(arguments[1]);
                    break;
                    case 'resume':
                        jobResume(arguments[1],true);
                    break;
                    case 'inspect':
                        return jobInspect(arguments[1]);
                }
            break;
        }
        return app;
    };
    
    /**
     * allows user to set event listeners on $.jqMVC. Should be noted that events bound on $.jqMVC are not garbage collected, so be mindful of binding with listen inside of route closures, where listenOnce() should be bound instead.
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
        $(app).off(event,callback);
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
            a = a.concat(b);
            for(var i=0; i<a.length; ++i) {
                for(var j=i+1; j<a.length; ++j) {
                    if(a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        };
        Array.prototype.push.apply(args,arguments);
        for(var k=0;k<args.length;k++){
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
     * Router Control Function - Used to pass on a route, possibly to the next matching route. if no additional match is found, notFound is emitted.
     * @returns {object} $.jqMVC
     */
    app.pass = function()
    {
        throw 'pass';
    };
    
    /**
     *  the path to the application
     *  @name path
     */
    Object.defineProperty(app, "path", { 
        get: function () { 
            var r = new RegExp(window.location.origin);
            var path = app_path.replace(r,'').replace(/\/+/g, '/').trim('/');//possibly unsafe.
            return (!path.length ? '/' : path);
        } 
    });
    
    /**
     * parses the querystring into an object of key value pairs and returns it. returns empty object if querystring isnt set.
     * @returns {object} querystring
     */
    app.query = function () 
    {
        var str = (window.location.search || '?').substr(1);
        return (!str.length ? {} : str.trim().split('&').reduce(function (ret, param) {
            var parts = param.replace(/\+/g, ' ').split('=');
            ret[parts[0]] = parts[1] === undefined ? null : xssFilter(parts[1]);
            return ret;
        }, {}));    
    };
    
    /**
     * runs the app for the first time, then overwrites run so it cant be called again. executes all middleware, including the app itself. no params and no return value.
     */
    app.run = function()
    {
        var can_run = canRun();
        if(can_run !== true){
            emit('app.incompatible',can_run);//can_run would have details of why it cant run.
        }
        app.add(function(){
            router.go(location.href);
        }); //add app.go to the middleware stack
        stack.next();//start the middleware stack.
        app.run = function(){};//remove app.run
    };
    
    /**
     * create a route object and add it to the router. Note: Any arguments between first and last argument of the function are treated as middleware.Middleware should accept a stack argument. stack has two functions, next and halt(callback). if halt is called the route closure is not invoked. therefore to continue execution, you must define some behavior in the callback provided to halt, such as triggering a notFound error, or redirecting to another page with go() showing a permissions error screen etc.
     * @param {string|RegExp} path - use `:name` for placeholders accepts either an String with optional placeholders or RegExp object
     * @param {function} callback - the route closure.
     * @example $.jqMVC.route('/posts/:title/:id',function(title,id){ //your code here });
     * @example $.jqMVC.route(/^\/user\/[0-9]+$/,middleware1,middleware2,callback);
     * @returns {object} $.jqMVC
     */
    app.route = function()
    {
        var args = [];
        Array.prototype.push.apply( args, arguments );
        var route = args.shift(); //first arg is always the path
        var callback = args.pop(); //last arg is the callback
        var middleware = args; //safe to assume remaining arguments are middleware
        var isRegExp = typeof route == "object";
    
        if (!isRegExp) {
            route = router.normalize(route);
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
     * Add a service to the global svc object. services are a great way to write reusable objects and functions and access them from any scope.
     * @param {string} name - the name for the service eg 'foobar' would be accessed svc.foobar()
     * @param {*} mixedvar - an object or callable function are recommended, but a service can be anything.
     * @returns {object} $.jqMVC
     */
    app.svc = function(name,mixedvar)
    {
        svc[name] = mixedvar;//services are flexible types.
        return app;
    };
    
    /**
     * trigger an event on $.jqMVC
     * @param {string} event - the event to trigger
     * @param {object} [eventData] - optional event data to pass to event.
     * @returns {object} $.jqMVC
     */
    app.trigger = function(event,eventData)
    {
        emit(event,eventData);
        return app;
    };
    
    /**
     * create a handler for destroying things before.go. should be called from inside `bind()` or `bindOnce()`. this function only executes once per view, between navigations.
     * @param {function} callable - a valid callable function.
     * @returns {object} $.jqMVC
     */
    app.unload = function(callable)
    {
        destructors.push(callable);
        return app;
    };
    
    /**
     *  exposes the internal view object via a getter.
     *  @name view
     */
    Object.defineProperty(app, "view", { 
        get: function () { 
            return view; 
        } 
    });
    
    /**
     * Add a named Web Worker to the internal workers object
     * @param {string} name - the name for the Web Worker
     * @param {function} onmessage - the worker function. works the same as onmessage of a webworker.
     * @returns {object} $.jqMVC
     */
    app.worker = function(name,onmessage)
    {
        workers[name] = Worker.create(onmessage);
        return app;
    };
    
    /**
     *  exposes the worker object, so dev can retrieve reference to a specific worker or inspect workers.
     *  @name workers
     */
    Object.defineProperty(app, "workers", { 
        get: function () { 
            return workers; 
        } 
    });
    $.jqMVC = app;//expose jqMVC
}(jQuery,window,document));