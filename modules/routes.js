$.jqMVC
.route('/',function(){
	var query = $.jqMVC.query();
	var redirect = query.redirect || false;
	if(!redirect){
		svc.nav('home',function(){
			var scroll = query.scroll || false;
			if(scroll){
				$.jqMVC.bindOnce(function(){
					$('#'+scroll).click();
				});
			}
			$.jqMVC.view.render('index.twig',{},$.jqMVC.done);
		});	
	}else{
		$.jqMVC.halt(function(){
			$.jqMVC.go('/'+redirect);
		});
	}
})
.route('/docs',function(name){
	svc.nav('',function(){
		$.jqMVC.view.render('docs.twig');//empty args and no callback imply defaults of {} and jqMVC.done
	});
})
.route('/learn',function(name){
	svc.nav('',function(){
		$.jqMVC.view.render('learn.twig');//empty args and no callback imply defaults of {} and jqMVC.done
	});
})
.route('/chat',function(name){
	svc.nav('',function(){
		$.jqMVC.view.render('chat.twig');//empty args and no callback imply defaults of {} and jqMVC.done
	});
})
.route('/download',function(name){
	$.getJSON('https://api.github.com/repos/r3wt/jqMVC/releases',function(data){
		svc.nav('',function(){
			$.jqMVC.view.render('downloads.twig',{downloads: data},$.jqMVC.done);
		});	
	});
});