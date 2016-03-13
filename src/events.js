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
	var c = t.closest('[jq-ctrl]');
	
	if(c.length > 0){
		return window.ctrl[c.jq('ctrl')] || false;
	}else{
		return window.ctrl;//no controller is set. assume they will use controller.method ie `foobar.SomeFunc`
	}
}

//this function simply resolves a binding to its controller, if it exists.
//t = $(element)
//c = string controller method OR controller name . method
//ex `jq-ctrl="fooController" jq-unload="barMethod"` OR `jq-unload="fooController.barMethod"`
function resolve(t,c)
{
	var d = getController(t);
	if(d !== false){
		return d[t.jq(c)];
	}else{
		return eval('window.ctrl.'+t.jq(c));//nasty!
	}
}

evt.bindDefaults = function()
{
	//default html bindings.
	
	/***
	  * blocked
	  * jq-subview= example <div jq-view="template,apiCall,apiArgs"></div>
	  * jq-observe= observe mutation of element.
	  */
	
	
	if(!eventAdded){
		//author `cocco` @ http://stackoverflow.com/a/17567696/2401804
		(function(d){
			var ce=function(e,n){
				var a=document.createEvent("CustomEvent");
			a.initCustomEvent(n,true,true,e.target);
				e.target.dispatchEvent(a);
				a=null;
				return false;
			},
			nm=true,
			sp={x:0,y:0},
			ep={x:0,y:0},
			touch={
				touchstart:function(e){
					sp={x:e.touches[0].pageX,y:e.touches[0].pageY};
				},
				touchmove:function(e){
					nm=false;
					ep={x:e.touches[0].pageX,y:e.touches[0].pageY};
				},
				touchend:function(e){
					if(nm){
						ce(e,'fc');
					}else{
						var x=ep.x-sp.x,
						xr=Math.abs(x),
						y=ep.y-sp.y,
						yr=Math.abs(y);
						if(Math.max(xr,yr)>20){
							ce(e,(xr>yr?(x<0?'swl':'swr'):(y<0?'swu':'swd')));
						}
					}
					nm=true;
				},
				touchcancel:function(e){
					nm=false;
				}
			};
			for(var a in touch){
				d.addEventListener(a,touch[a],false);
			}
		}(document));
		//end taken from stackoverflow.
		eventAdded = true;
	}
	
	
	/*
	jq-swipe-left = on swipe left. (touch device only)
	jq-swipe-right = on swipe right. (touch device only)
	jq-swipe-up = on swipe up only.
	jq-swipe-down = on down only.
	jq-fast-click  = fastclick
	*/

	$.each({
		swr: 'swipe-right',
		swl: 'swipe-left',
		swu: 'swipe-up',
		swd: 'swipe-down',
		fc:  'fast-click'
	},function(k,v){
		$('[jq-'+v+']').each(function(){
			$(this).on( k, resolve( $(this), v) );
		});
	})
	
	$.each([
		'click',
		'dblclick',
		'mousedown',
		'mouseup',
		'keydown',
		'keypress',
		'keyup',
		'change',
		'scroll',
		'dragstart',
		'dragstop',
		'error'
	],function(k,v){
		$('[jq-'+v+']').each(function(){
			$(this).on( v , resolve( $(this), v ) );
		});
	});
	
	//jq load/unload
	$('[jq-load]').each(function(i,v){
		resolve( $(this), 'load' ).apply(this);
	});
	$('[jq-unload]').each(function(i,v){
		app.unload( resolve( $(this) , 'unload' ) );//because aliens.
	});
	
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
					data = JSON.parse(data);
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
	
	$(window).bind("popstate", router.popstate);
};



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