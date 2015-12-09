//middleware stack
var stack = {};

stack.items = [];

stack.next = function(){
	log('jqMVC -> middleware -> stack.next()')
	stack.items.shift().call($,stack);
};
//end middleware stack