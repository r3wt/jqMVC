$.jqMVC
.route('/',function(){
	$.jqMVC.view.render('index.twig',{},$.jqMVC.done);
})
.route('/:name',function(name){
	$.jqMVC.view.render('index.twig',{name:name},function(){
		$.jqMVC
		.alert('I hope you have enjoyed this demo!','information')
		.done();
	});
});