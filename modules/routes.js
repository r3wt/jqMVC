$.jqMVC
.route('/',function(){
	svc.nav('home',function(){
		$.jqMVC.view.render('index.twig',{},$.jqMVC.done);
	});
})
.route('/docs',function(name){
	svc.nav('docs',function(){
		$.jqMVC.view.render('docs.twig');//empty args and no callback imply defaults of {} and jqMVC.done
	});
});