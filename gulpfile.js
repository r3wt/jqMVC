var doc   =  require('gulp-documentation'),
	gulp  = require('gulp'),
	fs    = require('fs'),
	jsp = require("uglify-js").parser,
	pro = require("uglify-js").uglify,
	order = [
		'header.js',//check
		'env.js',//check
		'funcs.js',//check
		'events.js',//check
		'stack.js',//check
		'router.js',//check
		'app.js',//check
		'footer.js'//check
	];

gulp.task('default', function() {
	var code = '',
	copyright = fs.readFileSync('./src/copyright.txt','utf8') + '\r\n';
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
	fs.writeFile('./jqMVC.js',copyright+code, 'utf8',function(){
		//now minify
		// var code2 = code.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm,'$1').replace(/\r?\n|\r/g,'').trim().match(/\S+/g).join('');
		// fs.writeFile('./jqMVC.min.js',copyright+code2,'utf8');
		var ast = jsp.parse(code); // parse code and get the initial AST
		ast = pro.ast_mangle(ast); // get a new AST with mangled names
		ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
		var final_code = pro.gen_code(ast); // compressed code here
		fs.writeFile('./jqMVC.min.js',copyright+final_code,'utf8');
	});
	
	gulp.src('./src/app.js')
    .pipe(doc({ format: 'html' }))
    .pipe(gulp.dest('docs'));
});