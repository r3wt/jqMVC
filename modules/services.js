//services are like components that need to exist seperate from the main view. for example, maybe you need to manage the state of a navigation bar or sidebar.
$.jqMVC.svc('nav',function(user,callback){
	//now i would use my service like svc.nav( args ..).
	//these arguments are just examples, you may obviously do this anyway you see fit.
});