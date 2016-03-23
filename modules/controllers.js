$.jqMVC
.ctrl('index',{
})
.ctrl('docs',{
})
.ctrl('chat',{
	resize: function(){
		$('#chat-frame').height($(window).height() - $('.navbar').height() - 50);
	}
});