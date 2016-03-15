$.jqMVC
.route('/',function(){
	$.jqMVC.view.render('index.twig',{},$.jqMVC.done);
})
.route('/docs',function(name){
	$.jqMVC.view.render('docs.twig');//empty args and no callback imply defaults of {} and jqMVC.done
});