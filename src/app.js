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