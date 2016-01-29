$.jqMVC
.ctrl('index',{
	submit: function(){
		var name = $('#name').val();
		if(name == ''){
			$.jqMVC.alert('Name cant be blank','error');
		}else{
			$.jqMVC.alert('Thank you!','success');
			$.jqMVC.go('/'+name);
		}
	}
});