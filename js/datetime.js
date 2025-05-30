// Joe's Date/Time Tools
// Copyright (c) 2004 - 2025 Joseph Huckaby
// Released under the Sustainable Use License

var _months = [
	[ 1, 'January' ], [ 2, 'February' ], [ 3, 'March' ], [ 4, 'April' ],
	[ 5, 'May' ], [ 6, 'June' ], [ 7, 'July' ], [ 8, 'August' ],
	[ 9, 'September' ], [ 10, 'October' ], [ 11, 'November' ],
	[ 12, 'December' ]
];
var _days = [
	[1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10],
	[11,11], [12,12], [13,13], [14,14], [15,15], [16,16], [17,17], [18,18], 
	[19,19], [20,20], [21,21], [22,22], [23,23], [24,24], [25,25], [26,26],
	[27,27], [28,28], [29,29], [30,30], [31,31]
];

var _short_month_names = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 
	'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

var _day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 
	'Thursday', 'Friday', 'Saturday'];
	
var _short_day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

var _number_suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];

var _hour_names = ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

function time_now() {
	// return the Epoch seconds for like right now
	var now = new Date();
	return Math.floor( now.getTime() / 1000 );
}

function hires_time_now() {
	// return the Epoch seconds for like right now
	var now = new Date();
	return ( now.getTime() / 1000 );
}

function format_date(thingy, template) {
	// format date using get_date_args
	// e.g. '[yyyy]/[mm]/[dd]' or '[dddd], [mmmm] [mday], [yyyy]' or '[hour12]:[mi] [ampm]'
	if (!thingy) return false;
	var dargs = thingy.yyyy_mm_dd ? thingy : get_date_args(thingy);
	return template.replace(/\[(\w+)\]/g, function(m_all, m_g1) {
		return (m_g1 in dargs) ? dargs[m_g1] : '';
	});
}

function get_date_args(thingy) {
	// return hash containing year, mon, mday, hour, min, sec
	// given epoch seconds
	if (!thingy) thingy = new Date();
	if ((typeof(thingy) == 'string') && thingy.match(/^(\d{4}\D+\d{2}\D+\d{2}|\d{2}\D+\d{2}\D+\d{4})$/)) {
		// JS date parser seems to miss-calculate unless dates have times
		thingy += ' 00:00:00';
	}
	var date = (typeof(thingy) == 'object') ? thingy : (new Date( (typeof(thingy) == 'number') ? (thingy * 1000) : thingy ));
	var args = {
		epoch: Math.floor( date.getTime() / 1000 ),
		year: date.getFullYear(),
		mon: date.getMonth() + 1,
		mday: date.getDate(),
		hour: date.getHours(),
		min: date.getMinutes(),
		sec: date.getSeconds(),
		msec: date.getMilliseconds(),
		wday: date.getDay(),
		offset: 0 - (date.getTimezoneOffset() / 60)
	};
	
	args.yyyy = '' + args.year;
	args.d = '' + args.mday;
	if (args.mon < 10) args.mm = "0" + args.mon; else args.mm = '' + args.mon;
	if (args.mday < 10) args.dd = "0" + args.mday; else args.dd = '' + args.mday;
	if (args.hour < 10) args.hh = "0" + args.hour; else args.hh = '' + args.hour;
	if (args.min < 10) args.mi = "0" + args.min; else args.mi = '' + args.min;
	if (args.sec < 10) args.ss = "0" + args.sec; else args.ss = '' + args.sec;
	
	if (args.hour >= 12) {
		args.ampm = 'pm';
		args.hour12 = args.hour - 12;
		if (!args.hour12) args.hour12 = 12;
	}
	else {
		args.ampm = 'am';
		args.hour12 = args.hour;
		if (!args.hour12) args.hour12 = 12;
	}
	args.h12 = '' + args.hour12;
	
	args.ampm = args.ampm.toUpperCase();
	args.yyyy_mm = args.yyyy + '/' + args.mm;
	args.yyyy_mm_dd = args.yyyy + '/' + args.mm + '/' + args.dd;
	args.hh_mi_ss = args.hh + ':' + args.mi + ':' + args.ss;
	args.tz = 'GMT' + (args.offset > 0 ? '+' : '') + args.offset;
	
	// add formatted month and weekdays
	args.mmm = _short_month_names[ args.mon - 1 ];
	args.mmmm = _months[ args.mon - 1] ? _months[ args.mon - 1][1] : '';
	args.ddd = _short_day_names[ args.wday ];
	args.dddd = _day_names[ args.wday ];
	
	return args;
}

function get_time_from_args(args) {
	// return epoch given args like those returned from get_date_args()
	var then = new Date(
		args.year,
		args.mon - 1,
		args.mday,
		args.hour,
		args.min,
		args.sec,
		0
	);
	return parseInt( then.getTime() / 1000, 10 );
}

function yyyy(epoch) {
	// return current year (or epoch) in YYYY format
	if (!epoch) epoch = time_now();
	var args = get_date_args(epoch);
	return args.year;
}

function yyyy_mm_dd(epoch, ch) {
	// return current date (or custom epoch) in YYYY/MM/DD format
	if (!epoch) epoch = time_now();
	if (!ch) ch = '/';
	var args = get_date_args(epoch);
	return args.yyyy + ch + args.mm + ch + args.dd;
}

function mm_dd_yyyy(epoch, ch) {
	// return current date (or custom epoch) in YYYY/MM/DD format
	if (!epoch) epoch = time_now();
	if (!ch) ch = '/';
	var args = get_date_args(epoch);
	return args.mm + ch + args.dd + ch + args.yyyy;
}

function normalize_time(epoch, zero_args) {
	// quantize time into any given precision
	// example hourly: { min:0, sec:0 }
	// daily: { hour:0, min:0, sec:0 }
	var args = get_date_args(epoch);
	for (key in zero_args) args[key] = zero_args[key];

	// mday is 1-based
	if (!args['mday']) args['mday'] = 1;

	return get_time_from_args(args);
}

function get_nice_date(epoch, abbrev) {
	var dargs = get_date_args(epoch);
	var month = window._months[dargs.mon - 1][1];
	if (abbrev) month = month.substring(0, 3);
	return month + ' ' + dargs.mday + ', ' + dargs.year;
}

function get_nice_time(epoch, secs) {
	// return time in HH12:MM format
	var dargs = get_date_args(epoch);
	if (dargs.min < 10) dargs.min = '0' + dargs.min;
	if (dargs.sec < 10) dargs.sec = '0' + dargs.sec;
	var output = dargs.hour12 + ':' + dargs.min;
	if (secs) output += ':' + dargs.sec;
	output += ' ' + dargs.ampm.toUpperCase();
	return output;
}

function get_nice_date_time(epoch, secs, abbrev_date) {
	return get_nice_date(epoch, abbrev_date) + ' ' + get_nice_time(epoch, secs);
}

function get_short_date_time(epoch) {
	return get_nice_date(epoch, true) + ' ' + get_nice_time(epoch, false);
}

function parse_date(str) {
	// parse date into epoch
	return Math.floor( ((new Date(str)).getTime() / 1000) );
};

function check_valid_date(str) {
	// return true if a date is valid, false otherwise
	// returns false for Jan 1, 1970 00:00:00 GMT
	var epoch = 0;
	try { epoch = parse_date(str); }
	catch (e) { epoch = 0; }
	return (epoch >= 86400);
};

// Relative Time Component
// create via getFormRelativeTime()

var RelativeTime = {
	
	mults: {
		seconds: 1,
		minutes: 60,
		hours: 3600,
		days: 86400
	},
	
	init: function(sel) {
		// initialize all based on selector
		var self = this;
		
		$(sel).each( function() {
			var $this = $(this);
			var $text = $this.next().find("input");
			var $menu = $this.next().find("select");
			var $both = $this.next().find("input, select");
			
			$both.on('change', function() {
				var adj_value = parseInt( $text.val() );
				if (isNaN(adj_value) || (adj_value < 0)) return;
				var unit = $menu.val();
				var mult = self.mults[ unit ];
				var value = adj_value * mult;
				$this.val( value );
			});
		});
	}
	
}; // RelativeTime

