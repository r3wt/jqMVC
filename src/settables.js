//notifications
var notify = {
	alert:function(message){
		alert(message);
	},
	confirm:function(message,callback){
		if(confirm(message)){
			callback.apply(this);
		}
	}
};

//progress
var progress = {
	start: function(){
		
	},
	stop: function(){
	}
};
	
//view
var view = {
	render: function(){
		app.done();
		throw 'You must implement a view with `setView()` before you can render templates';
	}
};

//model
var model = {
	
};