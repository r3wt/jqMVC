//internal utilities
function isDefined(t)
{
    return typeof t !== 'undefined';
}

function isString(t)
{
    return typeof t === 'string';
}

function isWindow(t)
{
    return t && t.document && t.location && t.alert && t.setInterval;
}

function isDocument(t)
{
    return window.document === t;
}

function isApp(t)
{
    return t === app;
}

function canRun()
{
	var can = true,
	reason = {};
	if(!(history && history.pushState)){
		can = false;
		reason.router = 'Browser Does not support History API';
	}
	if((!window.URL.createObjectURL) || typeof Worker === "undefined"){
		can = false;
		reason.worker = 'Browser Does not support Webworkers';
	}
	return (!can) ? reason : true;
}

function log()
{
	if (debug) {
		/* jshint ignore:start */
		window.console && console.log.apply(console,arguments);
		/* jshint ignore:end */
	}
}

function emit(event,eventData)
{
    log('jqMVC -> emit -> '+event);
    $(app).trigger(event,eventData);
}

function escapeRegExp(str)
{
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function jobPending()
{
	for(var job in jobs){
		//called by the system before navigation to temporarily suspend jobs.
		//therefore we make sure a job isnt paused so it wont be resumed after app.done() is called
		safelyStopJob(job,0);
	}   
}

function safelyStopJob(job,newState)
{
	if(jobs[job].state !== 3){
		jobs[job].state = newState;
	}
	clearInterval(jobs[job].timer);
	if(newState == -1){
		delete jobs[job];
	}
}

function jobResume(targets,ignoreState)
{
	var obj = (targets === undefined || (targets !== undefined && targets === '*')) ? jobs : false;
	if(!obj){
		obj = {};
		if(jobs.hasOwnProperty(targets)){
			obj[targets] = jobs[targets];
		}
	}
	for(var job in obj){
		if(jobs[job].state !==3 || targets == '*'){
			safelyStopJob(job,0);
			var thisJob = jobs[job];
			thisJob.state = 1;
			thisJob.timer = setInterval(thisJob.payload,thisJob.interval);
		}
	}          
}

function jobPause(targets)
{
	if(targets === '*'){
		for(var job in jobs){
			safelyStopJob(job,3);
		}
	}else{
		if(jobs.hasOwnProperty(targets)){
			safelyStopJob(targets,3);
		}
	}
}

function jobDestroy(targets)
{
	if(targets == '*'){
		for(var job in jobs){
			safelyStopJob(job,-1);
		}
	}else{
		if(jobs.hasOwnProperty(targets)){
			safelyStopJob(targets,-1);
		}
	}
}

function jobInspect(targets)
{
	if(targets === '*'){
		return jobs;
	}else{
		if(jobs.hasOwnProperty(targets)){
			return jobs[targets];
		}else{
			return 'job doesnt exist';
		}
	}
}

function timeParse(t)
{
	if(typeof t == 'string'){
		var m = t.match(/^(\d+)(MS|S|M|H|ms|s|m|h)$/);
		if(m.length == 3){
			var a = parseInt(m[1]),
				b = m[2].toLowerCase(),
				c = {
					ms: 1,
					s : 1000,
					m : 60000,
					h : 3.6e+6
				};
			t = a * c[b];
		}else{
			t = -1;
		}
	}
	return t;
}