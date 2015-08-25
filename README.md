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

