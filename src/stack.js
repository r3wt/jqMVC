stack.items = [];

stack.next = function(){
    log('jqMVC -> middleware -> next()');
    stack.items.shift().call($,stack);
};