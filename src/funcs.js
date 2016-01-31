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
		reason[1] = 'Browser Does not support History API';
	}
	return (can === false) ? reason : true;
}

function log()
{
    if (debug) {
        window.console && console.log.apply(console,arguments);
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

$.fn.serializeObject = function()
{ 
    var b = this.serializeArray();
    var a = {};
    for(var i=0;i<b.length;i++){
        a[b[i].name] = b[i].value;
    }
    return a;
};

$.fn.jq = function(attr,val)
{
    if(typeof attr === 'string'){
        if(typeof val !== 'undefined'){
            this.attr('jq-'+attr,val);
        }else{
            return this.attr('jq-'+attr);
        }
    }
    return this;
};

function jobPending()
{
    for(var job in jobs){
        //called by the system before navigation to temporarily suspend jobs.
        //therefore we make sure a job isnt paused so it wont be resumed after app.done() is called
        if(jobs[job].state !== 3){
            safelyStopJob(job,0);
        }
    }   
}

function safelyStopJob(job,newState)
{
	if(jobs[job].state !== 1 && jobs[job].state !== 2){
		jobs[job].state = newState;
        clearInterval(jobs[job].timer);
		if(newState == -1){
			delete jobs[job];
		}
	}else{
		setTimeout(function(){ safelyStopJob(job,newState); }, 10);
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
		if(jobs[job].state == 0 || ignoreState !== undefined){
			jobs[job].state = 1;
			jobs[job].timer = setInterval(function(){
				if(jobs[job].state !== 2){
					jobs[job].state = 2;
					jobs[job].payload.call(this);
					jobs[job].state = 1;
				}
			},jobs[job].interval);
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
        if(jobs.hasOwnProperty(job)){
            safelyStopJob(job,-1);
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
    log('parsing time: '+t);
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
    log('parsed time: ' + t);
    return t;
}