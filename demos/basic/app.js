$(function(){
	
	// In this example we will use Nprogress and Twig.js for Progress and View respectively.
	// most, if not all methods are chainable.
	
	$.jqMVC
	
	// first we want to setup some progress indicators.
	// we can do so by passing an object with start/stop functions
	.setProgress({
		start:function(){
			NProgress.start();
		},
		stop:function(){
			NProgress.done();
		}
	})
	
	// before starts the progress bar
	// probably wise to always start it here at startup.
	.before()
	
	// as of v1.1.1 config is replaced with data.
	// data sets items from a given object on window,
	// making these vars globally availabe to both your code and the framework.
	.data({
		app_path  : '/demos/basic/', //app path is for when your app is not running in document root
		api_path  : 'http://jqmvc.openex.info/demos/basic/api/',//api path to datasrc
		ctrl_path : 'ctrl/', //controller path
		view_path : 'views/', //it should be noted that twig only accepts a relative path at the moment.
		module_path : 'modules/', //where to look for modules.
		element : $('div.view'), //main view element where views are rendered.
		debug : true ,//whether or not to display debugging info. doesnt do much currently other than show emitted events.
		tpl_cache : false, //whether to cache templates or nah
		tpl_args : {} //default template args
	})
	
	// in order to render views, we must provide an object with a `render method`. you can use anything you want
	// i like twig.js so i show an example of that here
	.setView({
		render: function(file,args,callback,el){
			$.jqMVC.trigger('before.render');
			var self = this;
			twig({
				href: location.origin + app_path + view_path+file,
				load: function(template) { 
					var html = template.render(args);
					$.jqMVC.trigger('on.render');
					var target = (el === undefined) ? element : el;
					target.html(html);
					if (typeof callback === "function") {
						callback.call(self);
					}
				},
				cache: tpl_cache
			});
		}
	})
	
	// you may need to perform some async stuff before you run the app first time,
	// such as fetching some json and setting up some data, etc.
	// you may add stack level middleware for these types of task like so:
	// when run is called, the first stack is invoked
	// all middlewares must invoke the next stack like stack.next()
	.add(function(stack){
		//creates a global called platformData;
		$.getJSON(api_path + 'csrf.json',function(data){
			$.jqMVC.data({csrf: data.response});
			
			// now we have a csrf token, we can setup ajax to automatically use our token
			$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
				options.data = $.param($.extend(originalOptions.data, { c: csrf }));
			});
			
			// now lets get the platformData to get basic info about user etc.
			$.getJSON(api_path + 'platformData.json',function(data){
				$.jqMVC.data({platformData: data.response});
				stack.next(); //finally were done here, so we can continue on to the next stack.
			});
		});
	})
	
	// lets set up a listener for api errors
	.listen('apiError',function(){
		var args = {
			error: '500 Internal Server Error'
		};
		$('title').html(args.error);
		$.jqMVC.render('error.twig',args,function(){
			$.jqMVC.done();
		});
	})
	
	// lets setup a listener for the first run of the app to perform some quick setup
	.listen('firstRun',function(){
		$(document).ajaxError(function(){
			$.jqMVC.trigger('apiError');
		});
	})
	
	// lets listen for route not found
	.listen('notFound',function(){
		var args = {
			error: '404 Not Found'
		};
		$('title').html(args.error);
		$.jqMVC.render('error.twig',args,function(){
			$.jqMVC.done();
		});
	})
	
	// when user changes route, we do not automatically invoke $.jqMVC.before()
	// we can hook before.go to start it on route change.
	.listen('before.go',function(){
		$.jqMVC.before();
	})
	
	// lets define some routing for our app
	.path('/',function(){
		$('title').html('Hello World');
		$.jqMVC.render('hello.twig',{},function(){
			$.jqMVC.controller('hello.js?v=1');
			$.jqMVC.done();
		});
	})
	
	// when user submits name we say hello
	.path('/hello/:name',function(name){
		console.log(name);
		var args = {name:name};
		$('title').html('Hello '+args.name);
		$.jqMVC.render('hello.twig',args,function(){
			$.jqMVC.done();
		});
	})
	
	.run();
});