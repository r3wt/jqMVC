    //set default app settings
	app.data({
		app_path  : window.location.origin,
		api_path  : '',
		view_path : '/', 
		element : $('body'),
		debug : false,
		binding_override: false,
	});
	
	$.jqMVC = app;//expose jqMVC
}(jQuery,window,document));