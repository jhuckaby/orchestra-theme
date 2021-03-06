// Custom single- and multi-drop-down menus

var SingleSelect = {
	
	maxMenuItems: 2000,
	
	init: function(sel) {
		// initialize all single-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			$this.css('display', 'none');
			
			var $ms = $('<div class="multiselect single"></div>');
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible select div
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-unfold-more-horizontal"></div>');
				
				var opt = self.options[ self.selectedIndex ] || self.options[0] || { label: "(None)" };
				var html = '<div class="single">';
				if (opt.getAttribute && opt.getAttribute('data-icon')) {
					html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
				}
				html += (opt.label || opt.value);
				html += '</div>';
				$ms.append(html);
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			$ms.on('mouseup', function() {
				// create popover dialog for selecting and filtering
				var html = '';
				if ($ms.hasClass('disabled')) return;
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Select Item') + '</div>';
				html += '<div class="sel_dialog_search_container">';
					html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
					html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
				html += '</div>';
				html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea">';
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					html += '<div class="sel_dialog_item check ' + (opt.selected ? 'selected' : '') + '" ' + ((idx >= SingleSelect.maxMenuItems) ? 'style="display:none"' : '') + ' data-value="' + opt.value + '">';
					if (opt.getAttribute && opt.getAttribute('data-icon')) {
						html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
					}
					html += '<span>' + (opt.label || opt.value) + '</span>';
					html += '<div class="sel_dialog_item_check"><i class="mdi mdi-check"></i></div>';
					html += '</div>';
				}
				
				html += '<div id="d_sel_dialog_more">';
				if (self.options.length > SingleSelect.maxMenuItems) {
					html += '(' + commify(self.options.length - SingleSelect.maxMenuItems) + ' more items not shown)';
				}
				html += '</div>';
				
				html += '</div>';
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('mouseup', function() {
					// select item, close dialog and update multi-select
					var $item = $(this);
					$this.val( $item.data('value') );
					
					Popover.detach();
					// redraw();
					$this.trigger('change');
				});
				
				var $input = $('#fe_sel_dialog_search');
				$input.focus();
				
				// setup keyboard handlers
				$input.on('keyup', function(event) {
					// refresh list on every keypress
					var value = $input.val().toLowerCase();
					var num_matched = 0;
					
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
						var $item = $(this);
						var text = $item.find('> span').html().toLowerCase();
						
						if (!value.length || (text.indexOf(value) > -1)) {
							if (num_matched < SingleSelect.maxMenuItems) $item.addClass('match').show();
							else $item.removeClass('match').hide();
							num_matched++;
						}
						else {
							$item.removeClass('match').hide();
						}
					} ); // each
					
					if (num_matched > SingleSelect.maxMenuItems) {
						$('#d_sel_dialog_more').html( '(' + commify(num_matched - SingleSelect.maxMenuItems) + ' more items not shown)' );
					}
					else $('#d_sel_dialog_more').html('');
					
					Popover.reposition();
				});
				$input.on('keydown', function(event) {
					// capture enter key
					var value = $input.val().toLowerCase();
					if ((event.keyCode == 13) && value.length) {
						event.preventDefault();
						$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger('mouseup');
					}
				});
				
				// highlight select field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { $ms.removeClass('selected'); };
			}); // mouseup
			
		}); // forach elem
	}
	
}; // SingleSelect

var MultiSelect = {
	
	init: function(sel) {
		// initialize all multi-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			
			var $ms = $('<div class="multiselect"></div>');
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible multiselect div
				var num_sel = 0;
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-unfold-more-horizontal"></div>');
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					if (opt.selected) {
						var html = '<i class="mdi mdi-close">&nbsp;</i>';
						if (opt.getAttribute && opt.getAttribute('data-icon')) {
							html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
						}
						html += opt.label;
						var $item = $('<div class="item"></div>').data('value', opt.value).html(html);
						$ms.append( $item );
						num_sel++;
					}
				}
				
				if (num_sel) $ms.append( '<div class="clear"></div>' );
				else $ms.append( '<div class="placeholder">' + ($this.attr('placeholder') || 'Click to select...') + '</div>' );
				
				$ms.find('div.item > i.mdi-close').on('mouseup', function(e) {
					// user clicked on the 'X' -- remove this item and redraw
					var $item = $(this).parent();
					var value = $item.data('value');
					for (var idx = 0, len = self.options.length; idx < len; idx++) {
						var opt = self.options[idx];
						if (opt.selected && (opt.value == value)) {
							opt.selected = false;
							idx = len;
						}
					}
					// redraw();
					$this.trigger('change');
					e.stopPropagation();
					e.preventDefault();
					return false;
				});
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			$ms.on('mouseup', function() {
				// create popover dialog for selecting and filtering
				var html = '';
				if ($ms.hasClass('disabled')) return;
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Select Items') + '</div>';
				html += '<div class="sel_dialog_search_container">';
					html += '<input type="text" id="fe_sel_dialog_search" class="sel_dialog_search" autocomplete="off" value=""/>';
					html += '<div class="sel_dialog_search_icon"><i class="mdi mdi-magnify"></i></div>';
				html += '</div>';
				html += '<div id="d_sel_dialog_scrollarea" class="sel_dialog_scrollarea">';
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					html += '<div class="sel_dialog_item check ' + (opt.selected ? 'selected' : '') + '" data-value="' + opt.value + '">';
					if (opt.getAttribute && opt.getAttribute('data-icon')) {
						html += '<i class="mdi mdi-' + opt.getAttribute('data-icon') + '">&nbsp;</i>';
					}
					html += '<span>' + (opt.label || opt.value) + '</span>';
					html += '<div class="sel_dialog_item_check"><i class="mdi mdi-check"></i></div>';
					html += '</div>';
				}
				html += '</div>';
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				$('#d_sel_dialog_scrollarea > div.sel_dialog_item').on('mouseup', function(event) {
					// select item, close dialog and update multi-select
					var $item = $(this);
					var value = $item.data('value');
					var new_sel_state = !$item.hasClass('selected');
					
					for (var idx = 0, len = self.options.length; idx < len; idx++) {
						var opt = self.options[idx];
						if (opt.value == value) {
							opt.selected = new_sel_state;
							
							// JH 2021-01-01 added this line:
							if (new_sel_state) $item.addClass('selected'); else $item.removeClass('selected');
							
							idx = len;
						}
					}
					
					// JH 2021-01-01 added this if:
					if (!$this.data('hold') || (self.options.length == 1) || event.altKey) Popover.detach();
					// redraw();
					$this.trigger('change');
				});
				
				var $input = $('#fe_sel_dialog_search');
				$input.focus();
				
				// setup keyboard handlers
				$input.on('keyup', function(event) {
					// refresh list on every keypress
					var value = $input.val().toLowerCase();
					$('#d_sel_dialog_scrollarea > div.sel_dialog_item').each( function() {
						var $item = $(this);
						var text = $item.find('> span').html().toLowerCase();
						if (!value.length || (text.indexOf(value) > -1)) {
							$item.addClass('match').show();
						}
						else {
							$item.removeClass('match').hide();
						}
					} );
					Popover.reposition();
				});
				$input.on('keydown', function(event) {
					// capture enter key
					var value = $input.val().toLowerCase();
					if ((event.keyCode == 13) && value.length) {
						event.preventDefault();
						
						var mup = jQuery.Event( "mouseup" );
						mup.altKey = true; // bypass `hold` feature
						$('#d_sel_dialog_scrollarea > div.sel_dialog_item.match').slice(0, 1).trigger(mup);
					}
				});
				
				// highlight multiselect field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { $ms.removeClass('selected'); };
			}); // mouseup
			
		}); // forach elem
	}
	
}; // MultiSelect

var TextSelect = {
	
	init: function(sel) {
		// initialize all text-selects based on selector
		$(sel).each( function() {
			var self = this;
			var $this = $(this);
			
			var $ms = $('<div class="multiselect"></div>');
			$this.after( $ms );
			
			var redraw = function() {
				// render contents of visible multiselect div
				var num_sel = 0;
				$ms.empty();
				$ms.append('<div class="select_chevron mdi mdi-plus"></div>');
				
				for (var idx = 0, len = self.options.length; idx < len; idx++) {
					var opt = self.options[idx];
					var $item = $('<div class="item"></div>').data('value', opt.value).html(
						'<i class="mdi mdi-close">&nbsp;</i>' + opt.label
					);
					$ms.append( $item );
					num_sel++;
				}
				
				if (num_sel) $ms.append( '<div class="clear"></div>' );
				else $ms.append( '<div class="placeholder">' + ($this.attr('placeholder') || 'Click to add...') + '</div>' );
				
				$ms.find('div.item > i').on('mouseup', function(e) {
					// user clicked on the 'X' -- remove this item and redraw
					var $item = $(this).parent();
					var value = $item.data('value');
					
					var idx = find_object_idx( self.options, { value: value } );
					self.options.remove( idx );
					
					$this.trigger('change');
					e.stopPropagation();
					e.preventDefault();
					return false;
				});
			}; // redraw
			
			redraw();
			
			// also trigger a redraw if the underlying hidden select changes
			$this.on('change', redraw);
			
			$ms.on('mouseup', function() {
				// create popover dialog for adding new items
				var html = '';
				if ($ms.hasClass('disabled')) return;
				
				html += '<div class="sel_dialog_label">' + ($this.attr('title') || 'Add New Item') + '</div>';
				html += '<div class="sel_dialog_search_container">';
					html += '<input type="text" id="fe_sel_dialog_text" class="sel_dialog_search" style="border-radius:2px;" autocomplete="off" value=""/>';
					html += '<div class="sel_dialog_search_icon"><i class="mdi ' + ($this.attr('icon') || 'mdi-plus') + '"></i></div>';
				html += '</div>';
				
				if ($this.attr('description')) {
					html += '<div class="sel_dialog_caption">' + $this.attr('description') + '</div>';
				}
				
				html += '<div class="sel_dialog_button_container">';
					html += '<div class="button" id="btn_sel_dialog_cancel">Cancel</div>';
					html += '<div class="button primary" id="btn_sel_dialog_add">' + ($this.attr('confirm') || 'Add Item') + '</div>';
				html += '</div>';
				
				Popover.attach( $ms, '<div style="padding:15px;">' + html + '</div>', $this.data('shrinkwrap') || false );
				
				var doAdd = function() {
					app.clearError();
					
					var value = $('#fe_sel_dialog_text').val().replace(/[\"\']+/g, '');
					if ($this.attr('trim')) value = value.trim();
					if ($this.attr('lower')) value = value.toLowerCase();
					if ($this.data('validate') && !value.match( new RegExp($this.data('validate')) )) {
						return app.badField('#fe_sel_dialog_text');
					}
					
					if (!value.length || find_object(self.options, { value: value })) {
						Popover.detach();
						return;
					}
					
					// add new item
					var opt = new Option( value, value );
					opt.selected = true;
					self.options[ self.options.length ] = opt;
					
					Popover.detach();
					$this.trigger('change');
				}; // doAdd
				
				$('#btn_sel_dialog_cancel').on('mouseup', function() { Popover.detach(); });
				$('#btn_sel_dialog_add').on('mouseup', function() { doAdd(); });
				
				var $input = $('#fe_sel_dialog_text').focus().on('keydown', function(event) {
					// capture enter key
					if ((event.keyCode == 13) && this.value.length) {
						event.preventDefault();
						doAdd();
					}
				});
				
				// highlight multiselect field under us
				$ms.addClass('selected');
				Popover.onDetach = function() { $ms.removeClass('selected'); };
			}); // mouseup
			
		}); // forach elem
	}
	
}; // TextSelect
