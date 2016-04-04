stack.items = [];
stack.next = function()
{
	//see #108 - have no idea why but some type of weirdness sometimes happens here.
	if(stack.items.length > 0){
		log('jqMVC -> middleware -> next()');
		stack.items.shift().call($,stack);	
	}
};