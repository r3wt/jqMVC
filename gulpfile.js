var doc   =  require('gulp-documentation'),
    gulp  = require('gulp'),
    fs    = require('fs'),
    ugly  = require('uglify-js'),
    order = [
        'header.js',//check
        'env.js',//check
        'funcs.js',//check
        'events.js',//check
        'stack.js',//check
        'router.js',//check
		'worker.js',
        'app.js',//check
        'footer.js'//check
    ];



gulp.task('default', function() {
    var code = '',
    copyright = fs.readFileSync('./src/copyright.txt','utf8') + '\r\n',
    replace = {
        '{{version}}':fs.readFileSync('./src/version.txt','utf8'),
        '{{date}}': getBuildDate(),
        '{{copyright_years}}': '2015 - 2016'
    };
    for(var prop in replace){
        copyright = copyright.replace(prop,replace[prop]);
    }
    for(var i=0;i<order.length;i++){
        var file = fs.readFileSync('./src/'+order[i],'utf8');
        if(i==0){
            file+='\r\n';
        }
        if(i !== order.length - 1 && i !== 0){
            var tmp = file.split('\r\n');
            for(var j=0;j<tmp.length;j++){
                tmp[j] = '    '+tmp[j]+'\r\n';
            }
            file = tmp.join('');
        }
        code +=file.replace(/\t/g,'    ');
    }
    fs.writeFile('./build/jqmvc-'+replace['{{version}}']+'.js',copyright+code, 'utf8',function(){
        //now minify
        var ast = ugly.parse(code); // parse code and get the initial AST
		ast.figure_out_scope();
		compressor = ugly.Compressor({hoist_vars:true,unsafe:true});
		ast.transform(compressor);
        ast.compute_char_frequency();
		ast.mangle_names();
        var final_code = ast.print_to_string(); // compressed code here
        fs.writeFile('./build/jqmvc-'+replace['{{version}}']+'.min.js',copyright+final_code,'utf8');
    });
    
    gulp.src('./src/app.js')
        .pipe(doc({ format: 'html',name: 'jqMVC' }))
        .pipe(gulp.dest('build/docs'));
});

function getBuildDate()
{
    var date = new Date(),
        datevalues = [
           date.getFullYear(),
           date.getMonth(),
           date.getDate(),
           date.getHours(),
           date.getMinutes(),
           date.getSeconds(),
        ],
        ts = Date.UTC.apply(Date,datevalues),
        date2 = new Date(ts);
        
    var month = date2.getMonth() + 1;//date is 0 based in Node?
    var day = date2.getDate();
    var hour = date2.getHours();
    var min = date2.getMinutes();
    var sec = date2.getSeconds();

    month = (month < 10 ? '0' : '') + month;
    day = (day < 10 ? '0' : '') + day;
    hour = (hour < 10 ? '0' : '') + hour;
    min = (min < 10 ? '0' : '') + min;
    sec = (sec < 10 ? '0' : '') + sec;
	
    var str = date.getFullYear() + '-' + month + '-' + day + '_' +  hour + ':' + min + ':' + sec + ' UTC';

    return str;
}