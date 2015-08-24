//all controllers must be named $ctrl;
var $ctrl = {
	
	//all controllers must have initialize method
	//you would place all of the specific view's event listeners and initialization code here, maybe setup some infinite scrolling etc.
	initialize : function(){
		
		$('title').html('Hello World!');
		
		$app.on('resize',window,function(){
			console.log('you resized the window');
		});
		
	},
	
	//destroy method is optional, but can be useful if you need to destroy instantiated jQuery plugins.
	destroy: function(){
		
		//maybe you have a plugin or something you need to clean up. you can do so here.
		
		$app.clean();//destroys all events and removes controllers. this is done automatically, but shown here for demonstration purposes.
	}
	
};