    //set default app settings
	app.data({
		app_path    : window.location.origin,
		api_path    : '/api/',
		view_path   : '/views',
		module_path :'/modules',
		model_path  : '/models',
		element     : $('body'),
		debug       : false,
		binding_override: false,
	});
	
	$.jqMVC = app;//expose jqMVC
}(jQuery,window,document));