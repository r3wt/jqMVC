$(function(){

	var config = {
		api_path : 'http://2fleek.com/api/v1/',//full path
		ctrl_path : 'http://2fleek.com/ctrl/', //full path
		view_path : 'twig/views/', //it should be noted that twig only accepts a relative path at the moment.
		element : $('div.view'), //main view element where views are rendered.
		debug : true //whether or not to display debugging info. doesnt do much currently other than show emitted events.
	};

	$.jqMVC.config(config); //configs the app, obviously.
	
	$.jqMVC.before(); // before() starts the progress bar. done() stops and removes it.
	
	//like services in angular, invokable at your leisure.
	$.jqMVC.addSvc('nav',function(user){
		console.log('nav service');
		twig({
			href: config.view_path+'nav.twig',
			load: function(template) { 
				$('nav').html(template.render(user));
			}
		});
	});
	//this simple service returns our csrf token for usage with our api.
	$.jqMVC.addSvc('csrf',function(){
		return $('meta[name="csrf"]').attr('content');
	});
	
	//before we can initialize our application, we need to get our csrf token and find out 
	//if the user is logged in. init.json provides us that data. lets get it and invoke our nav service with the result.
	$.getJSON(config.api_path+'init.json',function(data){
		//first we append the csrf token to our meta tag that stores the token.
		$('head').append('<meta name="csrf" content="'+data.result.csrf+'" />');
		//now we invoke our nav service.
		$.jqMVC.svc('nav',data.result);
	});

	//lets set up some routes.
	//do not use normal href's in your sites links. instead use `data-href` attribute.
	$.jqMVC
	.path('/',function(data){
		//to render a template, call jqMVC's render method signature: template,template args, callback (optional)
		$.jqMVC.render('index.twig',{},function(){
			//here i want to use the callback to instantiate my index controller.
			//ill append the current timestamp to the request to always load  fresh copy of the controller.
			$.jqMVC.controller('index.js?version='+ (new Date().getTime() / 1000 ) );
			//from the standpoint of our application, we have fullfilled the request. we need to stop the app now.
			$.jqMVC.done();
		});

	})
	.path('/404',function(data){
		//this example route passes some arguments to our template.
		var args = {
			code: 404,
			error: '404 Not Found'
		};
		$.jqMVC.render('error.twig',args,function(){
			//notice this view loads no controller.
			$('title').html('404 Not Found');
			$.jqMVC.done();
		});
	});
	
	//listen for navigation change and start the progress bar.
	$.jqMVC.listen('before.go',function(){
		$.jqMVC.before();
	});
	
	//now that we have fully defined our application, we can run it for the first time. 
	//think of run as a server, as it handles the initial request on page load, and nothing else.
	$.jqMVC.run();
});