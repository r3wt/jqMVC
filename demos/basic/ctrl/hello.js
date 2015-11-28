var $ctrl = {
	
	invoke: function(){
		
		$.jqMVC.data({
			helloSubmit: function(e){
				e.preventDefault();
				var name = $('#hello-name').find('input').val();
				$.jqMVC.go(app_path+'hello/'+name);
				return false;
			}
		});
		$(document).on('submit','#hello-name',helloSubmit);
	},
	
	destroy: function(){
		$(document).off('submit','#hello-name',helloSubmit);
		delete window.helloSubmit;
	}
	
};