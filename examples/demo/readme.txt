1. drop jqMVC.js into this folder.
2. make sure your server is configured to pass all requests in root directory without file extension to index.html
3. enjoy! :-)

PS: It works really well on nginx with a PHP REST api. I'm using slim framework. this is my nginx.conf:

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

