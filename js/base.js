// Base App Framework

var app = {
	
	username: '',
	cacheBust: 0,
	proto: location.protocol.match(/^https/i) ? 'https://' : 'http://',
	secure: !!location.protocol.match(/^https/i),
	retina: (window.devicePixelRatio > 1),
	mobile: !!navigator.userAgent.match(/(iOS|iPhone|iPad|Android)/),
	base_api_url: '/api',
	plain_text_post: false,
	prefs: {},
	
	init: function() {
		// override this in your app.js
	},
	
	extend: function(obj) {
		// extend app object with another
		for (var key in obj) this[key] = obj[key];
	},
	
	setAPIBaseURL: function(url) {
		// set the API base URL (commands are appended to this)
		this.base_api_url = url;
	},
	
	setWindowTitle: function(title) {
		// set the current window title, includes app name
		document.title = title + ' | ' + this.name;
	},
	
	setHeaderTitle: function(title) {
		// set header title
		$('.header_title').html( title );
	},
	
	showSidebar: function(visible) {
		// show or hide sidebar
		if (visible) $('body').addClass('sidebar');
		else $('body').removeClass('sidebar');
	},
	
	updateHeaderInfo: function() {
		// update top-right display
		// override this function in app
	},
	
	getUserAvatarURL: function(size, bust) {
		// get url to current user avatar
		var url = '';
		
		// user may have custom avatar
		if (this.user && this.user.avatar) {
			// convert to protocol-less URL
			url = this.user.avatar.replace(/^\w+\:/, '');
		}
		else {
			url = '/api/app/avatar/' + this.username + '.png?size=' + size;
		}
		
		if (bust) {
			url += (url.match(/\?/) ? '&' : '?') + 'random=' + Math.random();
		}
		
		return url;
	},
	
	doMyAccount: function() {
		// nav to the my account page
		Nav.go('MyAccount');
	},
	
	doUserLogin: function(resp) {
		// user login, called from login page, or session recover
		app.username = resp.username;
		app.user = resp.user;
		
		app.setPref('username', resp.username);
		app.setPref('session_id', resp.session_id);
		
		this.updateHeaderInfo();
		
		if (this.isAdmin()) $('#d_sidebar_admin_group').show();
		else $('#d_sidebar_admin_group').hide();
	},
	
	doUserLogout: function(bad_cookie) {
		// log user out and redirect to login screen
		if (!bad_cookie) {
			// user explicitly logging out
			Dialog.showProgress(1.0, "Logging out...");
			app.setPref('username', '');
		}
		
		app.api.post( 'user/logout', {
			session_id: app.getPref('session_id')
		}, 
		function(resp, tx) {
			Dialog.hideProgress();
			
			delete app.user;
			delete app.username;
			delete app.user_info;
			
			app.setPref('session_id', '');
			
			$('#d_header_user_container').html( '' );
			
			Debug.trace("User session cookie was deleted, redirecting to login page");
			Nav.go('Login');
			
			setTimeout( function() {
				if (bad_cookie) app.showMessage('error', "Your session has expired.  Please log in again.");
				else app.showMessage('success', "You were logged out successfully.");
			}, 150 );
			
			$('#tab_Admin').hide();
		} );
	},
	
	isAdmin: function() {
		// return true if user is logged in and admin, false otherwise
		return( app.user && app.user.privileges && app.user.privileges.admin );
	},
	
	handleResize: function() {
		// called when window resizes
		if (this.page_manager && this.page_manager.current_page_id) {
			var id = this.page_manager.current_page_id;
			var page = this.page_manager.find(id);
			if (page && page.onResize) page.onResize( get_inner_window_size() );
		}
		
		// also handle sending resize events at a 250ms delay
		// so some pages can perform a more expensive refresh at a slower interval
		if (!this.resize_timer) {
			this.resize_timer = setTimeout( this.handleResizeDelay.bind(this), 250 );
		}
		
		if (Dialog.active) Dialog.autoResize();
		else if (Popover.enabled && !this.mobile) Popover.detach();
	},
	
	handleResizeDelay: function() {
		// called 250ms after latest resize event
		this.resize_timer = null;
		
		if (this.page_manager && this.page_manager.current_page_id) {
			var id = this.page_manager.current_page_id;
			var page = this.page_manager.find(id);
			if (page && page.onResizeDelay) page.onResizeDelay( get_inner_window_size() );
		}
	},
	
	handleUnload: function(e) {
		// called just before user navs off
		if (this.page_manager && this.page_manager.current_page_id && $P && $P() && $P().onBeforeUnload) {
			var result = $P().onBeforeUnload();
			if (result) {
				(e || window.event).returnValue = result; //Gecko + IE
				return result; // Webkit, Safari, Chrome etc.
			}
		}
	},
	
	doError: function(msg, lifetime) {
		// show an error message at the top of the screen
		// and hide the progress dialog if applicable
		Debug.trace('error', "ERROR: " + msg);
		this.showMessage( 'error', msg, lifetime );
		if (Dialog.progress) Dialog.hideProgress();
		return null;
	},
	
	badField: function(id, msg) {
		// mark field as bad
		if (id.match(/^\w+$/)) id = '#' + id;
		$(id).removeClass('invalid').width(); // trigger reflow to reset css animation
		$(id).addClass('invalid');
		try { $(id).focus(); } catch (e) {;}
		if (msg) return this.doError(msg);
		else return false;
	},
	
	clearError: function(animate) {
		// clear last error
		app.hideMessage(animate);
		$('.invalid').removeClass('invalid');
	},
	
	showMessage: function(type, msg, lifetime) {
		// show success, warning or error message
		// Dialog.hide();
		var icon = '';
		switch (type) {
			case 'success': icon = 'check-circle'; break;
			case 'warning': icon = 'alert-circle'; break;
			case 'error': icon = 'alert-decagram'; break;
		}
		if (icon) {
			msg = '<i class="mdi mdi-'+icon+'">&nbsp;&nbsp;&nbsp;</i>' + msg;
		}
		
		$('#d_message_inner').html( msg );
		$('#d_message').hide().removeClass().addClass('message').addClass(type).show(250);
		
		if (this.messageTimer) clearTimeout( this.messageTimer );
		if ((type == 'success') || lifetime) {
			if (!lifetime) lifetime = 8;
			this.messageTimer = setTimeout( function() { app.hideMessage(500); }, lifetime * 1000 );
		}
	},
	
	hideMessage: function(animate) {
		if (animate) $('#d_message').hide(animate);
		else $('#d_message').hide();
	},
	
	api: {
		
		request: function(url, opts, callback, errorCallback) {
			// send HTTP GET to API endpoint
			Debug.trace('api', "Sending API request: " + url );
			opts.credentials = 'include';
			
			// inject session id into headers, unless app is using plain_text_post
			if (app.getPref('session_id') && !app.plain_text_post) {
				if (!opts.headers) opts.headers = {};
				opts.headers['X-Session-ID'] = app.getPref('session_id');
			}
			
			var timed_out = false;
			var timer = setTimeout( function() {
				timed_out = true;
				timer = null;
				var err = new Error("Timeout");
				Debug.trace('api', "HTTP Error: " + err);
				
				if (errorCallback) errorCallback({ code: 'http', description: '' + (err.message || err) });
				else app.doError( "HTTP Error: " + err.message || err );
			}, 1000 * 10 );
			
			window.fetch( url, opts )
				.then( function(res) {
					if (timer) { clearTimeout(timer); timer = null; }
					if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
					return res.json();
				} )
				.then(function(json) {
					// got response
					if (timed_out) return;
					if (timer) { clearTimeout(timer); timer = null; }
					var text = JSON.stringify(json);
					if (text.length > 8192) text = "(" + text.length + " bytes)";
					Debug.trace('api', "API Response: " + text );
					
					// use setTimeout to avoid insanity with the stupid fetch promise
					setTimeout( function() {
						if (('code' in json) && (json.code != 0)) {
							// an error occurred within the JSON response
							// session errors are handled specially
							if (json.code == 'session') app.doUserLogout(true);
							else if (errorCallback) errorCallback(json);
							else app.doError("API Error: " + json.description);
						}
						else if (callback) callback( json );
					}, 1 );
				} )
				.catch( function(err) {
					// HTTP error
					if (timed_out) return;
					if (timer) { clearTimeout(timer); timer = null; }
					Debug.trace('api', "HTTP Error: " + err);
					
					if (errorCallback) errorCallback({ code: 'http', description: '' + (err.message || err) });
					else app.doError( err.message || err );
				} );
		}, // api.request
		
		post: function(cmd, data, callback, errorCallback) {
			// send HTTP GET to API endpoint
			var url = cmd;
			if (!url.match(/^(\w+\:\/\/|\/)/)) url = app.base_api_url + "/" + cmd;
			
			// inject session in into json if submitting as plain text (cors preflight workaround)
			if (app.getPref('session_id') && app.plain_text_post) {
				data['session_id'] = app.getPref('session_id');
			}
			
			var json_raw = JSON.stringify(data);
			Debug.trace( 'api', "Sending HTTP POST to: " + url + ": " + json_raw );
			
			app.api.request( url, {
				method: "POST",
				headers: {
					"Content-Type": app.plain_text_post ? 'text/plain' : 'application/json',
				},
				body: json_raw
			}, callback, errorCallback );
		}, // api.post
		
		get: function(cmd, query, callback, errorCallback) {
			// send HTTP GET to API endpoint
			var url = cmd;
			if (!url.match(/^(\w+\:\/\/|\/)/)) url = app.base_api_url + "/" + cmd;
			
			if (!query) query = {};
			if (app.cacheBust) query.cachebust = app.cacheBust;
			url += compose_query_string(query);
			
			Debug.trace( 'api', "Sending HTTP GET to: " + url );
			app.api.request( url, {}, callback, errorCallback );
		} // api.get
		
	}, // api
	
	initPrefs: function(key) {
		// init prefs, load from localStorage if applicable
		this.prefs = {};
		
		if (localStorage.prefs) {
			Debug.trace('prefs', "localStorage.prefs: " + localStorage.prefs );
			try { this.prefs = JSON.parse( localStorage.prefs ); }
			catch (err) {
				Debug.trace('prefs', "ERROR: Failed to load prefs: " + err, localStorage.prefs);
			}
		}
		
		// apply defaults
		if (this.default_prefs) {
			for (var key in this.default_prefs) {
				if (!(key in this.prefs)) {
					this.prefs[key] = this.default_prefs[key];
				}
			}
		}
		
		Debug.trace('prefs', "Loaded: " + JSON.stringify(this.prefs));
	},
	
	getPref: function(key) {
		// get user preference, accepts single key, dot.path or slash/path syntax.
		return get_path( this.prefs, key );
	},
	
	setPref: function(key, value) {
		// set user preference, accepts single key, dot.path or slash/path syntax.
		set_path( this.prefs, key, value );
		this.savePrefs();
	},
	
	savePrefs: function() {
		// save local pref cache back to localStorage
		localStorage.prefs = JSON.stringify( this.prefs );
	},
	
	get_base_url: function() {
		return app.proto + location.hostname + '/';
	},
	
	setTheme: function(theme) {
		// toggle light/dark theme
		if (theme == 'dark') {
			$('body').addClass('dark');
			$('#d_theme_ctrl').html( '<i class="mdi mdi-weather-night"></i>' );
			this.setPref('theme', 'dark');
		}
		else {
			$('body').removeClass('dark');
			$('#d_theme_ctrl').html( '<i class="mdi mdi-lightbulb-on-outline"></i>' );
			this.setPref('theme', 'light');
		}
		
		if (this.onThemeChange) this.onThemeChange(theme);
	},
	
	initTheme: function() {
		// set theme to user's preference
		if (0 && !this.getPref('theme')) {
			// brand new user: try to guess theme using media query
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				this.setPref('theme', 'dark');
			}
		}
		this.setTheme( this.getPref('theme') || 'light' );
	},
	
	toggleTheme: function() {
		// toggle light/dark theme
		if (this.getPref('theme') == 'dark') this.setTheme('light');
		else this.setTheme('dark');
	},
	
	pullSidebar: function() {
		// mobile: pull sidebar over content
		if (!$('div.sidebar').hasClass('force')) {
			$('div.sidebar').addClass('force');
			
			if ($('#sidebar_overlay').length) {
				$('#sidebar_overlay').stop().remove();
			}
			
			var $overlay = $('<div id="sidebar_overlay"></div>').css('opacity', 0);
			$('body').append($overlay);
			$overlay.fadeTo( 500, 0.5 ).click(function() {
				app.pushSidebar();
			});
		}
	},
	
	pushSidebar: function() {
		// mobile: return sidebar to its hidden drawer
		if ($('div.sidebar').hasClass('force')) {
			$('div.sidebar').removeClass('force');
			$('#sidebar_overlay').stop().fadeOut( 500, function() { $(this).remove(); } );
		}
	}
	
}; // app object

function $P(id) {
	// shortcut for page_manager.find(), also defaults to current page
	if (!id) id = app.page_manager.current_page_id;
	var page = app.page_manager.find(id);
	assert( !!page, "Failed to locate page: " + id );
	return page;
};

window.Debug = {
	
	enabled: false,
	categories: { all: 1 },
	backlog: [],
	
	colors: ["#001F3F", "#0074D9", "#7FDBFF", "#39CCCC", "#3D9970", "#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#FF4136", "#F012BE", "#B10DC9", "#85144B"],
	nextColorIdx: 0,
	catColors: {},
	
	enable: function(cats) {
		// enable debug logging and flush backlog if applicable
		if (cats) this.categories = cats;
		this.enabled = true;
		this._dump();
	},
	
	disable: function() {
		// disable debug logging, but keep backlog
		this.enabled = false;
	},
	
	trace: function(cat, msg, data) {
		// trace one line to console, or store in backlog
		// allow msg, cat + msg, msg + data, or cat + msg + data
		if (arguments.length == 1) {
			msg = cat; 
			cat = 'debug'; 
		}
		else if ((arguments.length == 2) && (typeof(arguments[arguments.length - 1]) == 'object')) {
			data = msg;
			msg = cat;
			cat = 'debug';
		}
		
		var now = new Date();
		var timestamp = '' + 
			this._zeroPad( now.getHours(), 2 ) + ':' + 
			this._zeroPad( now.getMinutes(), 2 ) + ':' + 
			this._zeroPad( now.getSeconds(), 2 ) + '.' + 
			this._zeroPad( now.getMilliseconds(), 3 );
		
		if (data && (typeof(data) == 'object')) data = JSON.stringify(data);
		if (!data) data = false;
		
		if (this.enabled) {
			if ((this.categories.all || this.categories[cat]) && (this.categories[cat] !== false)) {
				this._print(timestamp, cat, msg, data);
			}
		}
		else {
			this.backlog.push([ timestamp, cat, msg, data ]);
			if (this.backlog.length > 1000) this.backlog.shift();
		}
	},
	
	_dump: function() {
		// dump backlog to console
		for (var idx = 0, len = this.backlog.length; idx < len; idx++) {
			this._print.apply( this, this.backlog[idx] );
		}
		this.backlog = [];
	},
	
	_print: function(timestamp, cat, msg, data) {
		// format and print one message to the console
		var color = this.catColors[cat] || '';
		if (!color) {
			color = this.catColors[cat] = this.colors[this.nextColorIdx];
			this.nextColorIdx = (this.nextColorIdx + 1) % this.colors.length;
		}
		
		console.log( timestamp + ' %c[' + cat + ']%c ' + msg, 'color:' + color + '; font-weight:bold', 'color:inherit; font-weight:normal' );
		if (data) console.log(data);
	},
	
	_zeroPad: function(value, len) {
		// Pad a number with zeroes to achieve a desired total length (max 10)
		return ('0000000000' + value).slice(0 - len);
	}
};

if (!window.assert) window.assert = function(fact, msg) {
	// very simple assert
	if (!fact) {
		console.error("ASSERT FAILURE: " + msg);
		throw("ASSERT FAILED!  " + msg);
	}
	return fact;
};

$(document).ready(function() {
	app.init();
});

window.addEventListener( "keydown", function(event) {
	Dialog.confirm_key(event);
	Popover.handleKeyDown(event);
}, false );

window.addEventListener( "resize", function() {
	app.handleResize();
}, false );

window.addEventListener("beforeunload", function (e) {
	return app.handleUnload(e);
}, false );
