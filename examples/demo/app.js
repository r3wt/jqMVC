$(function(){

	var config = {
		api_path : window.location.origin+'/api/',
		ctrl_path : window.location.origin+'/controllers/',
		view_path : 'templates/',
		element : $('div.view'),
	};

	$.jqMVC.config(config);
	
	$.jqMVC.before();
	
	$.jqMVC.addSvc('nav',function(user){
		console.log('nav service');
		twig({
			href: config.view_path+'nav.twig',
			load: function(template) { 
				$('nav').html(template.render(user));
			}
		});
	});
	
	$.jqMVC.addSvc('csrf',function(){
		return $('meta[name="csrf"]').attr('content');
	});
	
	$.getJSON(config.api_path+'init.json',function(data){
		$('head').append('<meta name="csrf" content="'+data.result.csrf+'" />');
		$.jqMVC.svc('nav',data.result);
	});

	$.jqMVC
	.path('/',function(data){
		$.jqMVC.render('index.twig',{},function(){
			console.log('index callback');
			$.jqMVC.controller('index.js?version='+ (new Date().getTime() / 1000 ) );
			$.jqMVC.done();
		});

	})
	.path('/404',function(data){
		var args = {
			code: 404,
			error: '404 Not Found'
		};
		$.jqMVC.render('error.twig',args,function(){
			$('title').html('404 Not Found');
			$.jqMVC.done();
		});
	});
	
	$.jqMVC.run();
});