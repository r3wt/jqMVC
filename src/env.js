var app = {},
    routeList = [],
    eventAdded = false,
    currentUsedUrl = location.href,
    firstRoute = true,
    firstRun = false,
    router = {},
    notify = {
        alert:function(){},
        confirm:function(){}
    },
    progress = {
        start: function(){},
        stop: function(){}
    },
    view = {},
    model = {},
    stack = {},
    jQselector = $.fn.init,
    jQbound = [],
    evt={},
    evtOnce = [],
    jobs={},
    destructors = [],
	workers={};

    /* define things are exposed */
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    window.ctrl = {};
    window.svc = {};
    window.models = {};
	window.workers = {};

    /* define default global settings that the app uses*/
    window.app_path         = '/';
    window.api_path         = '/api/';
    window.view_path        = '/views';
    window.module_path      ='/modules';
    window.element          = $('body');
    window.debug            = false;
    window.binding_override = false;

