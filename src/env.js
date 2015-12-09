var app = {},
	hasPushState = (history && history.pushState),
    hasHashState = !hasPushState && ("onhashchange" in window) && false,
    routeList = [],
    eventAdded = false,
    currentUsedUrl = location.href,
    firstRoute = true,
    firstRun = false,
    router = {},
    notify = {
		alert:function(message)
		{
			alert(message);
		},
		confirm:function(message,callback)
		{
			if(confirm(message)){
				callback.apply(this);
			}
		}
	},
    progress = {
		start: function(){},
		stop: function(){}
	},
    view = {
		render: function()
		{
			app.done();
			throw 'You must implement a view library to use this feature.';
		}
	},
    model = {},
	stack = {},
	jQselector = $.fn.init,
	jQbound = [],
	evt={};

window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
window.ctrl = {};
window.svc = {};
window.models = {};

