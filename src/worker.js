if(typeof Worker !== 'undefined'){
	Worker.createURL = function(c)
	{
		var str = (typeof c === 'function')?c.toString():c;
		var blob = new Blob(['\'use strict\';\nself.onmessage ='+str], { type: 'text/javascript' });
		return window.URL.createObjectURL(blob);
	};

	Worker.create = function(c)
	{
	  return new Worker(Worker.createURL(c));
	};	
}
