$.jqMVC
.data({
	app_path  : 'http://r3wt.github.io/jqMVC/',//app requires to know its base_path. 
	view_path : 'jqMVC/views/',
	module_path : 'modules/',
	element : $('#main'),
	debug : false,
	binding_override: false,
	default_args: {},
})
.before() //start the loading indicator
.setView({
	render: function(file,args,callback,el){
		try{
			if(typeof args !== 'undefined' && typeof default_args !== 'undefined'){
				args = $.extend(default_args,args);
			}else{
				args = default_args;
			}
			$.get(location.origin+'/'+view_path+file,function(htmlData){
				if(htmlData.indexOf('<!doctype') > 0){
					throw 'File not Found';
				}
				var target = (el === undefined) ? element : el;
				target.html(twig({data:htmlData}).render(args));
				if (typeof callback === "function") {
					callback.call();
				}else{
					$.jqMVC.done();//if no callback is defined call done
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
			}else{
				args = default_args;
			}
			$.get(location.origin+'/'+view_path+file,function(htmlData){
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
//create a middleware to load our modules.
.loadModules(['controllers.js','bindings.js','services.js','routes.js'])
.listen('before.go',function(){
	//if you need to do some stuff before navigation, like start a progress bar, clear the view, scroll up, etc.
	$.jqMVC.before();//before starts the progress bar
	window.scrollTo(0,0);
	$('#main').fadeOut(100).html('').fadeIn(0);
})
.run();//run app for first time