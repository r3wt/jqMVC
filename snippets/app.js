$(function(){
	
	$.jqMVC
	.setProgress({
		start:function(){
			NProgress.start();
		},
		stop:function(){
			NProgress.done();
		}
	})
	.before()
	.ctrl('auth',
		{
			login: function(data){
				if(data.error==0){
					$.jqMVC.go('/user/account');
				}else{
					$.jqMVC.alert(data.response,'error');
				}
			}
			register: function(data){
				if(data.error == 0){
					this.trigger('reset');//this is the form that triggered the callback.
				}else{
					$.jqMVC.alert(data.response,'error');
				}
			}
		}
	)
	.data({
		api_path  : 'http://example.com/api/v1/',
		view_path : 'views/', 
		module_path : 'modules/',
		element : $('#view'),
		debug : true ,
	})
	.setView({
		render: function(file,args,callback,el){
			try{
				if(typeof args !== 'undefined'){
					args = $.extend(default_args,args);
				}else{
					var args = default_args;
				}
				$.get(location.origin+'/'+view_path+file,function(htmlData){
					if(htmlData.indexOf('<!doctype') > 0){
						throw 'File not Found';
					}
					var target = (el === undefined) ? element : el;
					target.html(twig({data:htmlData}).render(args));
					if (typeof callback === "function") {
						callback.call();
					}
				}).fail(function(){
					throw 'Request Failed';
				});
			}
			catch(e){
				console.log(e);
				$.jqMVC.trigger('viewError');
				$.jqMVC.done();
			}
		}
	})
	.add(function(stack){
		//do something async, then when youre done call stack next
		stack.next();//final middleware in the stack is always the router.
	})
	.listen('notFound',function(){
		var args = {
			error: '404 Not Found'
		};
		$('title').html(args.error);
		$.jqMVC.render('error.twig',args,function(){
			$.jqMVC.done();
		});
	})
	.listen('before.go',function(){
		$.jqMVC.before();
	})
	.path('/',function(){
		$('title').html('Hello World');
		$.jqMVC.render('index.twig',{},function(){
			$.jqMVC.done();
		});
	})
	.path('/login',function(){
		var args = {
			api_path : api_path
		};
		$('title').html('Login');
		$.jqMVC.render('login.twig',args,function(){
			$.jqMVC.done();
		});
	})
	.path('/create-account',function(){
		var args = {};
		$('title').html('Register');
		$.jqMVC.render('register.twig',args,function(){
			$.jqMVC.done();
		});
	})
	.path('/abc/:one/:two/:three',function(one,two,three){
		$('title').html('whoa!');
		console.log(one,two,three);
		$.jqMVC.done();
	})
	.run();
});