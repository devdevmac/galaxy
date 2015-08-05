/** Renders contents of the default upload viewer */
define(['utils/utils',
        'mvc/upload/upload-model',
        'mvc/upload/composite/composite-row',
        'mvc/ui/ui-popover',
        'mvc/ui/ui-select',
        'mvc/ui/ui-misc'],

        function(   Utils,
                    UploadModel,
                    UploadItem,
                    Popover,
                    Select,
                    Ui
                ) {

return Backbone.View.extend({
    // extension selector
    select_extension : null,

    // genome selector
    select_genome: null,

    // collection
    collection : new UploadModel.Collection(),

    // initialize
    initialize : function(app) {
        // link app
        this.app                = app;
        this.options            = app.options;
        this.list_extensions    = app.list_extensions;
        this.list_genomes       = app.list_genomes;
        this.ui_button          = app.ui_button;

        // link this
        var self = this;

        // set element
        this.setElement(this._template());

        // create button section
        this.btnStart = new Ui.Button({ title: 'Start', onclick: function() { self._eventStart(); } });
        this.btnClose = new Ui.Button({ title: 'Close', onclick: function() { self.app.modal.hide(); } });

        // append buttons to dom
        var buttons = [ this.btnStart, this.btnClose ];
        for (var i in buttons) {
            this.$('#upload-buttons').prepend(buttons[i].$el);
        }

        // select extension
        this.select_extension = new Select.View({
            css         : 'footer-selection',
            container   : this.$('#footer-extension'),
            data        : _.filter(this.list_extensions, function(ext) { return ext.composite_files }),
            onchange    : function(extension) {
                // renew collection
                self.collection.reset();
                var details = _.findWhere(self.list_extensions, { id : extension });
                if (details && details.composite_files) {
                    for (var i in details.composite_files) {
                        var item = details.composite_files[i];
                        self.collection.add({
                            id          : self.collection.size(),
                            file_name   : '<b>-</b>',
                            file_desc   : item['description'] || item['name'] || 'Unavailable'
                        });
                    }
                }
            }
        });

        // handle extension info popover
        this.$('#footer-extension-info').on('click', function(e) {
            self._showExtensionInfo({
                $el         : $(e.target),
                title       : self.select_extension.text(),
                extension   : self.select_extension.value(),
                placement   : 'top'
            });
        }).on('mousedown', function(e) { e.preventDefault(); });

        // genome extension
        this.select_genome = new Select.View({
            css         : 'footer-selection',
            container   : this.$('#footer-genome'),
            data        : this.list_genomes,
            value       : this.options.default_genome
        });

        // listener for collection triggers on change in composite datatype
        this.collection.on('add', function (item) {
            self._eventAnnounce(item);
        });
        this.collection.on('change add', function(item) {
            self._updateScreen();
        });

        // trigger initial onchange event
        this.select_extension.options.onchange(this.select_extension.value());
    },

    //
    // upload events / process pipeline
    //

    // builds the basic ui with placeholder rows for each composite data type file
    _eventAnnounce: function(item) {
        // create view/model
        var upload_item = new UploadItem(this, { model : item });

        // add upload item element to table
        this.$('#upload-table > tbody:first').append(upload_item.$el);

        // render
        upload_item.render();

        // table visibility
        if (this.collection.length > 0) {
            this.$('#upload-table').show();
        } else {
            this.$('#upload-table').hide();
        }
    },

    // start upload process
    _eventStart : function() {
    },

    // progress
    _eventProgress : function(index, file, percentage) {
        // set progress for row
        var it = this.collection.get(index);
        it.set('percentage', percentage);

        // update ui button
        this.ui_button.set('percentage', this._uploadPercentage(percentage, file.size));
    },

    // success
    _eventSuccess : function(index, file, message) {
        // update status
        var it = this.collection.get(index);
        it.set('percentage', 100);
        it.set('status', 'success');

        // file size
        var file_size = it.get('file_size');

        // update ui button
        this.ui_button.set('percentage', this._uploadPercentage(100, file_size));

        // update completed
        this.upload_completed += file_size * 100;

        // update counter
        this.counter.announce--;
        this.counter.success++;

        // update on screen info
        this._updateScreen();

        // update galaxy history
        Galaxy.currHistoryPanel.refreshContents();
    },

    // error
    _eventError : function(index, file, message) {
        // get element
        var it = this.collection.get(index);

        // update status
        it.set('percentage', 100);
        it.set('status', 'error');
        it.set('info', message);

        // update ui button
        this.ui_button.set('percentage', this._uploadPercentage(100, file.size));
        this.ui_button.set('status', 'danger');

        // update completed
        this.upload_completed += file.size * 100;

        // update counter
        this.counter.announce--;
        this.counter.error++;

        // update on screen info
        this._updateScreen();
    },

    // queue is done
    _eventComplete: function() {
        // reset queued upload to initial status
        this.collection.each(function(item) {
            if(item.get('status') == 'queued') {
                item.set('status', 'init');
            }
        });

        // update running
        this.counter.running = 0;
        this._updateScreen();
    },

    // display extension info popup
    _showExtensionInfo : function(options) {
        // initialize
        var self = this;
        var $el = options.$el;
        var extension = options.extension;
        var title = options.title;
        var description = _.findWhere(this.list_extensions, { id : extension });

        // create popup
        this.extension_popup && this.extension_popup.remove();
        this.extension_popup = new Popover.View({
            placement: options.placement || 'bottom',
            container: $el,
            destroy: true
        });

        // add content and show popup
        this.extension_popup.title(title);
        this.extension_popup.empty();
        this.extension_popup.append(this._templateDescription(description));
        this.extension_popup.show();
    },

    // set screen
    _updateScreen: function () {
        // show default message
        this.$('#upload-info').html('You can Drag & Drop files into the rows.');

        // show start button if components have been selected
        if (this.collection.length == this.collection.where({ status : 'ready' }).length) {
            this.btnStart.enable();
        } else {
            this.btnStart.disable();
        }

        // table visibility
        if (this.collection.length > 0) {
            this.$('#upload-table').show();
        } else {
            this.$('#upload-table').hide();
        }
    },

    // calculate percentage of all queued uploads
    _uploadPercentage: function(percentage, size) {
        return (this.upload_completed + (percentage * size)) / this.upload_size;
    },

    // template for extensions description
    _templateDescription: function(options) {
        if (options.description) {
            var tmpl = options.description;
            if (options.description_url) {
                tmpl += '&nbsp;(<a href="' + options.description_url + '" target="_blank">read more</a>)';
            }
            return tmpl;
        } else {
            return 'There is no description available for this file extension.';
        }
    },

    // load html template
    _template: function() {
        return  '<div class="upload-view-composite">' +
                    '<div class="upload-top">' +
                        '<h6 id="upload-info" class="upload-info"/>' +
                    '</div>' +
                    '<div id="upload-footer" class="upload-footer">' +
                        '<span class="footer-title">Composite Type:</span>' +
                        '<span id="footer-extension"/>' +
                        '<span id="footer-extension-info" class="upload-icon-button fa fa-search"/> ' +
                        '<span class="footer-title">Genome/Build:</span>' +
                        '<span id="footer-genome"/>' +
                    '</div>' +
                    '<div id="upload-box" class="upload-box">' +
                        '<table id="upload-table" class="ui-table-striped" style="display: none;">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th/>' +
                                    '<th/>' +
                                    '<th>Description</th>' +
                                    '<th>Name</th>' +
                                    '<th>Size</th>' +
                                    '<th>Settings</th>' +
                                    '<th>Status</th>' +
                                '</tr>' +
                            '</thead>' +
                            '<tbody></tbody>' +
                        '</table>' +
                    '</div>' +
                    '<div id="upload-buttons" class="upload-buttons"/>' +
                '</div>';
    }
});

});
