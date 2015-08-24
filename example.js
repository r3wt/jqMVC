//include jQuery, twig.js, Nprogress.js, Nprogress.css, jQuery-router.js, and finally jqMVC.js before this file.


//document ready.
$(function(){
	
	$app.start(); //starts the application on load.
	
	
	//lets add a service to setup our nav bar. we will pass this service a `user` object, which will be false for not logged in, or an object for logged in.
	//any time a user logs in or logs out, we can just call the nav service.
	$app.service('nav',function(user){
		console.log(user);
		//since were not using our normal render function, we must configure twig ourselves.
		twig({
			href: 'twig/nav.twig?v=1.1',
			load: function(template) { 
				//twig loads the template and passes it here. 
				//render the template and insert it into `nav` element.
				$('nav').html(template.render(user));
			}
		});
	});
	
	//now that weve created our service for our navbar, we need to invoke it some how. we could do it right here, but thats dirty. lets use a hook
	$app.hook('before',function(){
		//rememeber, $app.api is the path to our api. you can use whatever you want though.
		$app.get($app.api+'user.json',function(data){
			//we  got the data, now lets invoke our nav service with it.
			$app.svc.nav(data.result);
		});
	});
	
	//add a route to the application
	$app.add('/',function(){
		//this example fetches some data before rendering the view.
		$app.get($app.api+'index.json',function(data){
			$app.render('index.twig',data,function(){
				$app.controller('index.js');
				$app.done(); //stops the progress bar
			});
		});
	});
	
	//hmm, we need an event to handle navigations to pages on our website. lets use $app.immutable()
	//assume we reference external links with target="_blank" and events with click handlers use href="#"
	$app.immutable('click','a:not([target="_blank"]):not([href="#"])',function(e){
		e.preventDefault();
		$app.start(); //remember, $app.start() starts Nprogress loading indicator
		//$app.go changes the route in the applicaiton.
		$app.go($(this).attr('href'));
		return false;
	});
	
	//now weve setup a basic application. lets run it.
	$app.run();
	
});