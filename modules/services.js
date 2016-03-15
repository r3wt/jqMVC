//services are like components that need to exist seperate from the main view. for example, maybe you need to manage the state of a navigation bar or sidebar.
$.jqMVC.svc('nav',function($state,cb){
	$.jqMVC.view.renderString('nav.twig',{state:$state},function(html){
		$('#nav').html(html);
		cb.apply(this);
	});
});