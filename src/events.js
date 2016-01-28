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
    
evt.bindRouter = function(){
    eventAdded = true;
    router.fromHash = false;

    if (hasPushState) {
        if (location.hash.indexOf("#!/") === 0) {
            var url = location.pathname + location.hash.replace(/^#!\//gi, "");
            history.replaceState({}, "", url);
            router.fromHash = true;
        }

        $(window).bind("popstate", handleRoutes);
        
    } else if (hasHashState) {
        $(window).bind("hashchange.router", handleRoutes);
    } else {
        // if no events are available we use a timer to check periodically for changes in the url
        router.interval = setInterval(function(){
            if (location.href != currentUsedUrl) {
                handleRoutes();
                currentUsedUrl = location.href;
            }
        }, 500);
    }
};

evt.bindHref = function()
{
    $(document).on('click','a[data-href]',function(e){
        e.preventDefault();
        emit('before.go');
        app.go( getPath().replace(/\/+$/, '')+$(this).data('href') ,'Loading');
        return false;
    });
};

evt.bindForm = function()
{
    $(document).on('submit','form[method][ctrl][action][callback]',function(event){
        //refactor to support file uploads.
        event.preventDefault();
        
        var $this = {};
        $this.el     = $(this);
        $this.method = $this.el.attr('method');
        $this.action = $this.el.attr('action');
        $this.ctrl   = $this.el.attr('ctrl');
        $this.bf     = $this.el.attr('before');
        $this.cb     = $this.el.attr('callback');
        $this.isFile = !!$this.el.find(':input[type="file"]').length;
        
        if($this.isFile){
            $this.data  = new FormData(this);
            $this.type  = false;
            $this.processData = false;
        }else{
            $this.data  = $this.el.serializeObject();
            $this.type  = 'application/x-www-form-urlencoded; charset=UTF-8';
            $this.processData = true;
        }
        
        if(typeof $this.bf === 'function'){
            new Promise(window.ctrl[$this.ctrl][$this.bf])
            .then(function(){
                formSubmit();
            },function(){
                //do we do anything else here or just let the before function handle the errors
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
                    window.ctrl[$this.ctrl][$this.cb].call( $this.el , data );
                },
                error: function(jqXHR, textStatus, errorThrown ){
                    window.ctrl[$this.ctrl][$this.cb].call( $this.el , {'error':1,'message': jqXHR.status +' '+ jqXHR.responseText} );
                }           
            }).always(function(){
                $this.el.find('button[type="submit"]').prop('disabled',false);
            });
        
        }
        return false;
    });
};

evt.bindModel = function()
{

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