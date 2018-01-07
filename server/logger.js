const log4js = require('log4js');
// TRACE、DEBUG、INFO、WARN、ERROR、FATAL

log4js.addLayout('json', function(config){
	return function(logEvent) { return JSON.stringify(logEvent) + config.separator; }
});

log4js.configure({
	appenders: {
		'stdout':{
			type:'console',
			category:'console'
		},
		'file':{
			type:'file',
			filename:__dirname+'/logs/node.log',
			maxLogSize:1024,
			backups:4,
			encoding:'utf-8',
			cotegory:'log_file'
		},
		'dateFile':{
			type: 'dateFile',
			filename:__dirname + '/logs/data',
			alwaysIncludePattern:true,
			compress:true,
			pattern:'-yyyy-MM-dd.log',
			encoding:'utf-8',
			category:'log_date',
			layout: {type:'messagePassThrough'}
			//layout: {type:'json',separator:','}
		}
	},
	categories:{
		default:{appenders:['stdout'],level:'info'},
		flux:{appenders:['dateFile'],level:'trace'}
	}
});

exports.logger = function(name) {
	var logger = log4js.getLogger(name);
	return logger;
};

//var lg = log4js.getLogger('log_file');
//lg.info('not ok');
