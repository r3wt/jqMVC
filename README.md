# jqMVC.js

jqMVC.js is a javascript framework aimed at jQuery developers.

  - Routing inspired by PHP's Slim Framework with named routes and parameter parsing. `$app.add(route[,id],callback)`
  - Templating with Twig.js, a port of PHP's powerful Twig Templating Engine. `$app.render(template,data,callback);
  - Services inspired by Angular.js's services.`$app.service(name,handler)` called like `$app.svc.name()`
  - Progress Indicators via NProgress.js `$app.start()` and `$app.done()`
  - Simple controller system `$ctrl = { initialize: function(){} };` that just makes more sense for client side MVC. a controller in client code needs to handle actions for that specific route, and interact with the main app, and nothing else.
  - Event manager maintains a list of events bound from controllers using the `$app.on(event,target,handler)` method.
  - Immutable events via `$app.immutable(event,target,handler)`
  - Loading a new controller automatically cleans previous controllers events via `$app.clean()`.
  - controllers can implement a `destroy()` method in order to destroy anything the framework cant handle on its own.

---
### Dependencies
jQmvc depends on the following resources to function:

* [jQuery] - https://code.jquery.com/
* [Nprogress] - https://github.com/rstacruz/nprogress
* [Twig.js] - https://github.com/justjohn/twig.js
* [jqMVC.router] (included)

---
### Getting Started

See the examples to get started

* https://github.com/r3wt/jqMVC/blob/master/examples/example_index.html
* https://github.com/r3wt/jqMVC/blob/master/examples/example_app.js
* https://github.com/r3wt/jqMVC/blob/master/examples/example_controller.js
---
### Notes
* you should instantiate your app inside of document ready. in this system, your app acts as the server handling the routing, fetching data from api, rendering views, and instantiating controllers.
```
$(function(){
    $app.start();
});
```
* you should define all your routes before calling `$app.run()` obviously.
* an example configuration for nginx with a Slim REST Api in the same folder, named api.php
```
location ~ ^/api {
    # you can either remove '/api' from the $request_uri here with regex (bad)
    # or you can let your php code account for it.(as i've done here)
    try_files $request_uri $request_uri/ /api.php?$query_string;
}

location / {
    # route any other requests to our jqMVC app, located at index.html
    include /etc/nginx/mime.types;
    try_files $uri /index.html?$query_string;
}
```
---
### License

https://github.com/r3wt/jqMVC/blob/master/LICENSE

