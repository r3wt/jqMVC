//everything event related
$.fn.init = function(selector,context)
{
    
    var trackSelector =  isDefined(selector) && !isApp(selector) && (( isString(selector) || isWindow(selector) || isDocument(selector) ) !== false);
    
    var jQinstance = new jQselector(selector,context||window.document,$);
    
    // we only track events bound on element(s), document, and window. 
    // events bound on plain objects such as those that are bound with 
    // $.jqMVC.listen and $.jqMVC.listenOnce are NOT tracked. #87
    if(trackSelector){
        jQbound = app.merge(jQbound,[selector]);//to prevent dupes in jqBound
    }

    return jQinstance;
};

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

function getController(t)
{
	var c = t.closest('jq-ctrl');
	if(c typeof string){
		var a = window.ctrl[c] || false;
		if(!a){
			return null;//let it blow up
		}
		return a;
	}else{
		return window.ctrl;//no controller is set. assume they will call controller.method() ie `foobar.SomeFunc()`
	}
}

//t = $(element)
//c = string controller method OR controller name . method
//ex `jq-ctrl="fooController" jq-unload="barMethod"` OR `jq-unload="fooController.barMethod"`
resolve(t,c)
{
	var d = getController(t);
	if(d === window.ctrl){
		return eval(t.jq(c));//ugly i know :-(
	}else{
		return d[t.jq(c)];
	}
}

evt.bindDefaults = function()
{
	//default html bindings.
	/*
	jq-selected = add into select tag to set selected option when rendered.
	jq-swipe-left = on swipe left. (touch device only)
	jq-swipe-right = on swipe right. (touch device only)
	jq-scroll-up = on scroll up only.
	jq-scroll-down = on scroll down only.
	jq-observe = observe mutation of element.
	*/
	
	/***
	  * blocked
	  * jq-subview= example <div jq-view="template,apiCall,apiArgs"></div>
	  *
	  */
	 
	//some can simply be converted to natives.
	var natives = [
		'click','dblclick','mousedown','mouseup','keydown','keypress','keyup','change','scroll','dragstart','dragstop','error'
	];
	for(var i=0;i<natives.length;i++){
		$(document).on('click','[jq-'+natives[i]+']',function(e){
			//return the output of callable in case return false was used to stop propagation
			//set selector as context and pass event
			return resolve( $(this), natives[i] ).apply(this,[e]);
		});
	}
	
	//jq load/unload
	$('[jq-load]').each(function(i,v){
		resolve( $(this), 'load' ).apply(this);
	});
	$('[jq-unload]').each(function(i,v){
		app.unload( resolve( $(this) , 'unload' ) );//because aliens.
	});
	
	//swipe left
	
	//swipe right
	
	//swipe down
	 
	$(document).on('submit','form[jq-method][jq-action][jq-callback]',function(event){
        //refactor to support file uploads.
        event.preventDefault();
        
        var $this = {};
        $this.el     = $(this);
        $this.method = $this.el.jq('method');
        $this.action = $this.el.jq('action');
        $this.bf     = $this.el.jq('before');
        $this.cb     = $this.el.jq('callback');
        $this.isFile = !!$this.el.find(':input[type="file"]').length;
		
		var controller = getController($this.el);
        
        if($this.isFile){
            $this.data  = new FormData(this);
            $this.type  = false;
            $this.processData = false;
        }else{
            $this.data  = $this.el.serializeObject();
            $this.type  = 'application/x-www-form-urlencoded; charset=UTF-8';
            $this.processData = true;
        }
        
        if(typeof $this.bf !== 'undefined'){
            new Promise(function(resolve,reject){
				controller[$this.bf]($this,resolve,reject);
            }).then(function(){
                formSubmit();
            },function(){
               
            });
        }else{
            formSubmit();
        }
        
        log(window,$this);
        
        function formSubmit()
        {
            $this.el.find('button[type="submit"]').prop('disabled',true);
            $.ajax({
                url: api_path + $this.action,
                type: $this.method.toUpperCase(),
                data:  $this.data,
                contentType: $this.type,
                cache: false,
                processData:$this.processData,
                success: function(data){
                    var data = JSON.parse(data);
					controller[$this.cb].call( $this.el , data );
                },
                error: function(jqXHR, textStatus, errorThrown ){
                    controller[$this.cb].call( $this.el , {'error':1,'message': jqXHR.status +' '+ jqXHR.responseText} );
                }           
            }).always(function(){
                $this.el.find('button[type="submit"]').prop('disabled',false);
            });
        
        }
        return false;
    });
	
	$(document).on('click','[jq-href]',function(e){
        e.preventDefault();
        emit('before.go');
        app.go( $(this).jq('href') ,'Loading');
        return false;
    });
	
	if(!eventAdded){
		eventAdded = true;
	}
	
	$(window).bind("popstate", router.popstate);
}

function unbind()
{
    log('jqMVC -> unbind');
    for(var i=0;i<destructors.length;i++){
        destructors[i].call(this);
    }
    destructors.length = 0;
    for(var i=0;i<jQbound.length;i++){
        $(jQbound[i]).find("*").addBack().off();
    }
    jQbound.length = 0;
    clearInterval(router.interval);//if router is using an interval it must be destroyed.
}

function bind()
{
    log('jqMVC -> bind');
    for(var ev in evt){
        var c = evt[ev];
        if(typeof c === 'function'){
            c.apply(this);
        }
    }
    for(var i=0;i<evtOnce.length;i++){
        var c = evtOnce[i];
        if(typeof c === 'function'){
            c.apply(this);
        }
    }
    evtOnce.length = 0;
}
//end events