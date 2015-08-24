/*!
 * jqMVC.js (C) 2015 jQMVC.js Developers, MIT license http://github.com/r3wt/jqMVC.git
 * @author Garrett R Morris (https://github.com/r3wt)
 * @package jqMVC.js
 * @license MIT
 */
var $app = {
	
	api_path: '', //path to your api
	ctrl_path: '',//path to your controllers.
	view_path: '',//path to your templates
	ctrl: null, //this is where the app stores whatever controller is loaded.
	
	view: $('body'), //define your main view element.
	
	
	//adds a route
	add : function(path,id,callback){
		$.router.add(path,id,callback); //id is optional
		return $app; //add is chainable.
	},
	
	//the router than runs 1 time on page load
	router : function(){
		if($.router.checkRoute(location.href) == false) {
			$app.go('/404');
		}else{
			$app.go(location.href);
		}
	},
	
	//get some json and perform a callback with the data.
	get: function(path,callback){
		$.getJSON(path,callback);
	},
	
	//navigate to a route, setting title to loading incase of blocking while waiting on template to render.
	go: function(href){
		$.router.go(href,'Loading...');
	},
	
	//start the app should probably rename this to onload or something
	start: function(){
		NProgress.start();
	},
	
	//whenever a view is done, it needs to call $app.done() to stop NProgress
	done: function(){
		NProgress.done();
	},
	
	//fetch a view and render it with the supplied args, then perform a callback.
	render: function(template,args,callback){
		twig({
			href: $app.view_path+template,
			load: function(template) { 
				var html = template.render(args);
				$app.view.html(html).promise().done(function(){
					if(typeof callback === "function"){
						callback();
					}
				});
			}
		});
	},
	
	//destroys any events created by a controller, removes the script tag, and optionally calls the controllers destroy() method, then sets $app.ctrl to null.
	clean : function(){
		
		if($app.events.length > 0){
			for(var i=0; i<$app.events.length;i++){
				$app.off($app.events[i].event,$app.events[i].target,$app.events[i].callback);
			}
			$app.events = [];	
		}
		
		if($app.ctrl !== null){
			if($app.ctrl.hasOwnProperty('destroy')){
				if(typeof $app.ctrl.destroy === "function"){
					$app.ctrl.destroy();
				}
			}
			$app.ctrl = null;	
		}
		
		if($('script.ctrl').length > 0){
			$('script.ctrl').remove();	
		}
		
	},
	
	//loads and executes a controller, optionally removing a current controller first.
	controller : function(controller){
		$app.clean();
		var s = document.createElement('script');
		s.setAttribute('src', $app.ctrl_path+controller);
		s.className = 'ctrl';
		s.onload= function(){
			$app.ctrl = $ctrl;
			$app.ctrl.initialize();
		};
		document.body.appendChild( s );
	},
	
	
	
	//services are controllers that live forever.
	svc: {},
	
	//define a service.
	service: function(name,callback){
		$app.svc[name] = callback;
	},
	
	
	
	//hooks
	hooks: {
		before: function(){},
		after: function(){},
		//in the future more hooks will be added to allow greater control of the app.
	},
	
	//define a hook.
	hook: function(what,callback){
		$app.hooks[what] = callback;
	},
	
	//events 
	events: [],
	
	//controllers can bind events here.
	on: function(event,target,callback){
		if($.isWindow(target)){
			$(window).on(event,callback);
		}else{
			$(document).on(event,target,callback);
		}
		
		$app.events.push({event:event,target:target,callback:callback});
	},
	
	//controllers can remove events
	off: function(event,target,callback){
		if($.isWindow(target)){
			$(window).unbind(event,callback);
		}else{
			$(document).off(event,target,callback);
		}
	},
	
	//immutable events are application wide events you don't want to ever unbind.
	immutable: function(event,target,callback){
		$(document).on(event,target,callback);
	},
	
	
	//stack initialization
	run: function(){
		$app.hooks.before();
		$app.router();
		$app.hooks.after();
	}
};