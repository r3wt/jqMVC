var app = {};

/**
 * Add a callback function to the middleware stack. IF called after .run() it does nothing.
 * @param {function} callback - a valid callable accepting the middleware stack object as argument.
 * @returns {object} $.jqMVC
 */
app.add = function(callable)
{
	stack.items.push(callable);
	return app;
};

/**
 * Add a global persistent event binding to the event loop. think of it as the SPA equivalent of $(document).ready, as any bindings you add will be executed everytime the app `runs`
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
 * Add a service to the global svc object.
 * @param {string} name - the name for the service eg 'foobar' would be accessed svc.foobar()
 * @param {*} mixedvar - an object or callable function are recommended, but a service can be anything.
 * @returns {object} $.jqMVC
 */
app.addSvc = function(name,mixedvar)
{
	window.svc[name] = mixedvar;//services are flexible types.
	return app;
};

/**
 * Call the internal notify.alert() method, which is set by by setAlert(object)
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
 * Add a controller object to global controller object. controllers can be referenced in html by `data-ctrl="ctrlname"` semantics.
 * @param {string} name - the name for the controller eg 'blogPosts' = ctrl.blogPosts
 * @param {object} obj - Controller object
 * @returns {object} $.jqMVC
 */
app.ctrl = function(name,obj)
{
	window.ctrl[name] = obj;
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
 * define a route object path Note: Any arguments between first and last argument of the function are treated as middleware. eg ` $.jqMVC.path(path,middleware1,middleware2,callback); Middleware is currently unsafe but is being reworked to use ES6 promises.
 * @param {string} path - use `:name` for placeholders
 * @param {function} callback - the route closure.
 * @example $.jqMVC.path('/posts/:title/:id',function(title,id){ //your code here });
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
 * set the internal notification Object.
 * @param {object} obj - the notification object for the app to use. default object just calls alert() and confirm() builtins with arguments.
 * @returns {object} $.jqMVC
 */
app.setNotifications = function(obj){
	notify = obj;
	return app;
};

/**
 * set the internal progress Object.
 * @param {object} obj - the progress object for the app to use. default object does nothing in either start() or stop() functions.
 * @returns {object} $.jqMVC
 */
app.setProgress = function(obj){
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
app.trigger = function(event,eventData){
	emit(event,eventData);
	return app;
};