//middleware stack
var stack = {};

stack.items = [];

stack.next = function(){
	stack.items.shift().call($,stack);
};
//end middleware stack