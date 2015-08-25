var $ctrl = {
	
	//initialize is the only requied method of the app.
	//you should setup all your events here and instantiate your plugins.
	initialize : function(){
		
		$('title').html('Hello World!');
		
		
		//any events added here will be destroyed by $.jqMVC.clean() on navigation
		$.jqMVC.on('resize',window,function(){
			console.log('resized window.');
		});
		
	},
	
	destroy: function(){
		
		//if you're using a plugin, you may have to write custom code here to destroy the instance of it and free memory.
		//the destroy function is optional
	}
	
};