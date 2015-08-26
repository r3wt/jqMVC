# jqMVC.js

jqMVC.js is a javascript framework aimed at jQuery developers. its simple design brings fun to a tedious MVC landscape.

  - `$.jqMVC` rocks!


---
### Dependencies
jQmvc depends on the following resources to function:

* [jQuery] - https://code.jquery.com/
* [Nprogress] - https://github.com/rstacruz/nprogress
* [Twig.js] - https://github.com/justjohn/twig.js

---
### Getting Started

See the demo app below for a quick start.

* https://github.com/r3wt/jqMVC/blob/master/examples/demo/

---
### Methods

>coming soon

---
### Events

* YOU MAY LISTEN TO THESE EVENTS using `$.jqMVC.listen(event,callback)` pattern.

* `on.config` - On App Configuration.
* `before.go` - Fires when clicking on an `data-href`. listen to this event if you want to display the progress bar during navigation.
* `on.go` - Fires when route callback search occurs is being invoked.
* `before.render` - Fires before a template is rendered
* `on.render` - Fires when a template is loaded and renders.
* `on.done` - Fires on done being called.
* `on.bindhref` - Fires after done, when data-href click listener is bound
* `on.controller` - Fires on loading of controller
* `on.service` - Fires on execution of a service
* `on.module` - Unimplemented as of yet, will fire on module load, so you can then instantiate modules inside controllers or globally
* `on.clean` - Fires when app is cleaned (controllers and events, and eventually modules destroyed)

---
### Notes

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

