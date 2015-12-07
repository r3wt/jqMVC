var doc   =  require('gulp-documentation'),
	gulp  = require('gulp'),
	fs    = require('fs'),
	order = [
		'header.js',//check
		'env.js',//check
		'settables.js',//check
		'util.js',//check
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
		code +=fs.readFileSync('./src/'+order[i],'utf8')+'\r\n';
	}
	fs.writeFile('./jqMVC.js',copyright+code, 'utf8',function(){
		//now minify
		var code2 = code.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm,'$1').replace(/\r?\n|\r/g,'').trim().match(/\S+/g).join('');
		fs.writeFile('./jqMVC.min.js',copyright+code2,'utf8');
	});
});