$.jqMVC
.data({
	app_path  : 'http://jqmvc.openex.info/seed/',//app requires to know its base_path. 
	view_path : 'views/', //view path
	module_path : 'modules/', //where to look for modules.
	element : $('#main'), //main view element where views are rendered.
	debug : true ,//whether to log debug info the console. $.jqMVC.debug() will work regardless of this flag.
	binding_override: true//allow to override default bindings of the framework. you can see these in src/events.js they are properties of the `evt` object.
})
.setProgress({
	//use nprogress for loading indicators.
	start: NProgress.start,
	stop: NProgress.done
})
.before() //start the loading indicator
.setView({
	//use twig to load templates and render views
	render: function(file,args,callback,el){
		try{
			if(typeof args !== 'undefined' && typeof default_args !== 'undefined'){
				args = $.extend(default_args,args);
			}
			$.get(app_path+view_path+file,function(htmlData){
				if(htmlData.indexOf('<!doctype') > 0){
					throw 'File not Found';
				}
				var target = (el === undefined) ? element : el;
				target.html(twig({data:htmlData}).render(args));
				if (typeof callback === "function") {
					callback.call();
				}
			}).fail(function(){
				throw 'Request Failed';
			});
		}
		catch(e){
			console.log(e);
			$.jqMVC.trigger('viewError').done();
		}
	},
	renderString: function(file,args,callback){
		try{
			if(typeof args !== 'undefined' && typeof default_args !== 'undefined'){
				args = $.extend(default_args,args);
			}
			$.get(app_path+view_path+file,function(htmlData){
				if(htmlData.indexOf('<!doctype') > 0){
					throw 'File not Found';
				}
				var compiledHtml = twig({data:htmlData}).render(args);
				if (typeof callback === "function") {
					callback.call(this,compiledHtml);
				}
			}).fail(function(){
				throw 'Request Failed';
			});
		}
		catch(e){
			console.log(e);
			$.jqMVC.trigger('viewError').done();
		}
	}
})
.setNotification({
	alert: function(_m,_t){
		console.log(_m);
		return noty({
			text: _m,
			type:_t,
			layout:'topCenter',
			timeout: 10000,
			animation: {
				open: {height: 'toggle',opacity:'1.0'}, // jQuery animate function property object
				close: {height: 'toggle',opacity:'0'}, // jQuery animate function property object
				easing: 'swing', // easing
				speed: 500 // opening & closing animation speed
			}
		});
	},
	confirm: function(_text,callback,args){
		var args = args || [];
		noty({
			text: _text,
			layout: 'center',
			modal: true,
			buttons: [
				{addClass: 'button tiny primary', text: 'Continue', onClick: function($noty) {
						$noty.close();
						callback.apply(window,args);
					}
				},
				{addClass: 'button tiny alert', text: 'Cancel', onClick: function($noty) {
						$noty.close();
					}
				}
			]
		});
	},
})
//create a middleware to load our modules.
.loadModules(['controllers.js','bindings.js','services.js','routes.js'])
.add(function(stack){
	/*
	//this example shows you how to use a middleware to initialize your app on first load. 
	//the example below adds a csrf token to all ajax requests and calls a service to set some global variables.
	$.getJSON(api_path + 'initialize_device',function(data){
		$.jqMVC.data({csrf: data.response});
		//this example is really useful. for a file upload, you need to append to the form data. other forms you just use params and extend.
		$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
			if(originalOptions.url.indexOf('.twig') === -1){
				if(originalOptions.data instanceof FormData){
					options = originalOptions;
					options.data.append('c',csrf);
				}else{
					options.data = $.param($.extend(originalOptions.data, { c: csrf }));
				}
			}
		});
		svc.getData(function(){
			stack.next()
		});
	});
	*/
	stack.next();//when your middleware is finish, it should call stack.next()
})
.listen('firstRun',function(){
	$(document).ajaxError(function(){
		$.jqMVC.trigger('apiError');
	});
})
.listen('apiError',function(){
	/* 
	//example how to listen for errors
	$.jqMVC.render('error.twig',{error: 'Unknown Error'},function(){
		$.jqMVC.done();
	});
	*/
})
.listen('notFound',function(){
	/*
	//example of how to listen for 404s
	$.jqMVC.render('error.twig',{error: '404 Not Found'},function(){
		$.jqMVC.done();
	});
	*/
})
.listen('before.go',function(){
	//if you need to do some stuff before navigation, like start a progress bar, clear the view, scroll up, etc.
	$.jqMVC.before();//before starts the progress bar
	window.scrollTo(0,0);
	$('#main').fadeOut(100).html('').fadeIn(0);
})
.run();//run app for first time