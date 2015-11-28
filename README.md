# jqMVC.js

jqMVC.js is a javascript framework aimed at jQuery and javascript developers. It features a simple and straightforward design,
that might be more approachable than other frameworks.

---
### DEMOS
* Hello World http://jqmvc.openex.info/demos/basic/

---
### Dependencies

* [jQuery] - https://code.jquery.com/

---
### Getting Started

See the basic hello world app for a quick look at how jqMVC functions.

* https://github.com/r3wt/jqMVC/blob/master/demos/basic/

---
### Basic Documentation
> `$.jqMVC.method()`


 - `add(function(stack){})` - adds a middleware to the stack to be ran before the app runs at startup. ideally this would allow you to do some async stuff to fetch some data before first render on page load. middleware must accept 1 argument which is the `stack` object. when your middleware is done doing its thing, you should call `stack.next()` when all the middleware has ran the app is run.
 - `addSvc(name,callback)` adds any helper function you want to the app, callable with `$.jqMVC.svc('svcname'[,args])`. a quick note on services, is that the `svc()` function treats the first argument as the service name, and any additional arguments as arguments to the service's callback function.
 - `before()` - calls internal method `progress.start()` you may implement whatever progress indicator you would like via `setProgress()` useful for starting up the progress indicator on first run 
 - `clean()` destroys any events created with `on()` and unloads all controllers, calling their `$ctrl.destroy()` if it exists. kind of shitty and needs a ton of work.
 - `controller(file)` loads a controller and calls `$ctrl.invoke()` method. path tried will be `app_path + ctrl_path + file`
 - `done()` whenever your app is done, call this to stop the progress bar. emits the `on.done` event and calls the internal method `bind_href()` to bind all `a[data-href]`'s to the event listener for navigation.
 - `go(path)` navigates to the given path(url), ie `$.jqMVC.go('/hello/world')`. emits the `before.go` event
 - `listen(event,callback)` binds an event listener to `$.jqMVC` a list of built in events are as so:
	 - `apiError` -not emitted automatically, see example app for a way to implement this automatic functionality. 
	 - `notFound` -emitted when no matching route is found
	 - `firstRun` -emitted on first run of the app
	 - `before.go` -emitted when go is called, before navigation occurs. useful listener for this event can start the progress bar.
	 - `on.bindhref` - emitted when the internal method `bind.href` fires. probably useless and will likely be removed.
	 - `on.controller` -emitted when the controller is loaded. could be useful if you need to do something extra with your controller, like add additional custom methods.
	 - `on.clean` -emitted when `$.jqMVC.clean()` is ran.
 - `loadModule(file)` loads a module. implementation of modules is a research area, so currently it just loads a script and appends to document.
 - `merge(obj1,obj2)` merges two object/arrays. could be useful for merging additional arguments into default template arguments.
 - `on(event,target,callback)` binds an event listener to an element. will be destroyed anytime `clean` is called.
 - `off(event,target,callback)` unbinds an event listener set with `on()`
 - `render([args])` since view implementation is left up to developer, this function calls the internal `view.render()` method, whatever the user has set. if user has not set a view object with `setView()`, the default view object will throw an exception.
 - `run()` runs the application for the first time. binds router state events, emits `firstRun` adds jqMVC to the middleware stack, then invokes the middleware stack.
 - `svc(name[,args])` calls a given service by `name` with `args` ie `$.jqMVC.svc('foobar',someArg1,someArg2);`
 - `setProgress(obj)` sets the progress object, which should have roughly this structure:
	```js
	var progress = {
		start: function(){
			
		},
		stop: function(){
		}
	};
	```
 - `setView(obj)` sets the view object, which should have roughly this structure:
	```js
	var view = {
	        render: function(){
	        }
	};
	
	```
 - `trigger(event,eventData)` allows triggering an event on `$.jqMVC object. either built in or custom events are supported. go nuts.
 
---
### License

https://github.com/r3wt/jqMVC/blob/master/LICENSE