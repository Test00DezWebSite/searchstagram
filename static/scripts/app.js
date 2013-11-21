(function(){

    window.App = {
        Models: {},
        Collections: {},
        Views: {},
        Router: {}
    };

    window.template = function(id){
        return _.template( $('#' + id).html());
    };

    /* operations for content header */
    App.Views.InitPage = Backbone.View.extend({

        tagName: 'span',

        template: template('content-header-template'),

        initialize: function(){
            this.render();
        },

        events: {
            'click a.addressSearch': 'addressSearch',
            'click a.findMe': 'findMe',
            'click a.clickMap': 'clickMap'
        },

        addressSearch: function(){
            var addSearchForm = new App.Views.AddressForm();
            $('#form').html(addSearchForm.render().el);
            $('#submission-form').attr('role', 'form');
            this.completeDateValues();
            $('input[id="addressSearch').geocomplete({
                details: 'form'
            });
        },

        findMe: function(){
            var addLocationForm = new App.Views.LocationForm();
            $('#form').html(addLocationForm.render().el);
            this.completeDateValues();
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    $("input[id='latitudeSearch']").attr('value', position.coords.latitude);
                    $("input[id='longitudeSearch']").attr('value', position.coords.longitude);
                    $('button#submit').trigger('click');
                }, null);
            } else {
                alert('Sorry, we could not find your location.');
            }
        },

        /*
        clickMap: function(){

            console.log('works');

            // create an instance of the model with a collection
            var map = new App.Models.Map({});

            // create an instance of the map
            var clickMapView = new App.Views.MapView({model:map});

            // this should be moved to the map model defaults?
            var initialMapData = {
                zoom: 4,
                geolatitude: 39.828116,
                geolongitude: -98.579392
            };

            // render the map
            clickMapView.render(initialMapData);

            // remove designator so we can re-render the map
            $('#content-map-canvas').removeClass('initial');
        },
        */

        completeDateValues: function(){
            var todayDate = new Date();
            var year = todayDate.getFullYear();
            var month = todayDate.getMonth()+1;
            var today = todayDate.getDate();
            var yesterday = todayDate.getDate()-1;
            var startDateValue = year + '-' + month + '-' + yesterday;
            var endDateValue = year + '-' + month + '-' + today;
            $("input[id='startDate']").attr('value', startDateValue);
            $("input[id='endDate']").attr('value', endDateValue);
        },

        render: function(){
            this.$el.html((this.template));
            return this;
        },

    });

    /* operations for address submission form */
    App.Views.AddressForm = Backbone.View.extend({

        id: 'submission-form',

        tagName: 'form',

        className: 'form-inline',

        template: template('address-form-template'),

        initialize: function(){
            this.render();
        },

        events: {
            'click button#submit': 'submitData',
        },

        submitData: function(){
            $('.progress').removeClass('hidden');
            $('#data-results').empty();
            var processData = new App.Views.ProcessData();
            processData.queryAPIForData();
        },

        render: function(){
            this.$el.html((this.template));
            return this;
        }
    });

    /* operations for geolocation form */
    App.Views.LocationForm = Backbone.View.extend({

        id: 'submission-form',

        tagName: 'form',

        className: 'form-inline',

        template: template('location-form-template'),

        initialize: function(){
            this.render();
        },

        events: {
            'click button#submit': 'submitData',
        },

        submitData: function(){
            $('.progress').removeClass('hidden');
            $('#data-results').empty();
            var processData = new App.Views.ProcessData();
            processData.queryAPIForData();
        },

        render: function(){
            this.$el.html((this.template));
            return this;
        }

    });

    // describes an image
    App.Models.Image = Backbone.Model.extend({
        defaults: {
            id: null,
            result_type: 'result_type',
            user: 'user',
            user_full_name: 'user_full_name',
            link: 'link',
            image_source: 'image_source',
            caption: 'caption',
            latitude: 47.601146851,
            longitude: -122.334979731,
            time_date: 'time_date'
        }
    });

    // a list of images
    App.Collections.Images = Backbone.Collection.extend({
        model: App.Models.Image
    });

    // view for all images
    App.Views.Images = Backbone.View.extend({

        tagName: 'div',

        id: 'image-container',

        className: 'row',

        render: function(){
            this.collection.each(function(image){
                var imageView = new App.Views.Image({model: image});
                this.$el.append(imageView.render().el);
            }, this);
            return this;
        }

    });

    // view for an image
    App.Views.Image = Backbone.View.extend({

        tagName: 'div',

        className: 'image-result col-xs-12 col-sm-6 col-md-4 col-lg-3',

        template: template('data-results-template'),

        render: function(){
            var addDisplayToggle = new App.Views.ProcessData();
            $('#display-toggle').html(addDisplayToggle.render().el);
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        }

    });

    App.Views.ProcessData = Backbone.View.extend({

        className: 'btn-group btn-group-justified',

        tagName: 'div',

        template: template('display-toggle-template'),

        initialize: function(){
            this.render();
        },

        queryAPIForData: function(){
            var radiusSearch = $('input[id="radiusSearch"]').val();
            var latitudeSearch = $('input[id="latitudeSearch"]').val();
            var longitudeSearch = $('input[id="longitudeSearch"]').val();
            var startDate = $('input[id="startDate"]').val();
            var startTime = $('input[id="startTime"]').val();
            var endDate = $('input[id="endDate"]').val();
            var endTime = $('input[id="endTime"]').val();
            var countSearch = $('input[id="countSearch"]').val();

            $.getJSON($SCRIPT_ROOT + '/search-query', {
                radius: radiusSearch,
                latitude: latitudeSearch,
                longitude: longitudeSearch,
                startdate: startDate,
                starttime: startTime,
                enddate: endDate,
                endtime: endTime,
                count: countSearch
            }, this.processData);
        },

        processData: function(data){
            $('#data-results').empty();

            $('.progress').addClass('hidden');

            // initialize new collection
            var resultsCollection = new App.Collections.Images();

            // add array of instagram images
            resultsCollection.add(data.result);

            // add array of tweets
            resultsCollection.add(data.tweets);

            // set the collection to a view
            var resultsView = new App.Views.Images({collection: resultsCollection});

            // add the view to the page
            $('#data-results').append(resultsView.render().el);

            // perform some gymnastics so the map is updated with results of second search
            if ($('#content-map-canvas').hasClass('initial')) {

                // create an instance of the model with a collection
                var map = new App.Models.Map({
                    markers: resultsCollection
                });

                // create an instance of the view
                var addMapView = new App.Views.MapView({model:map});

                // render the map
                addMapView.render(data);

                // remove designator so we can re-render the map
                $('#content-map-canvas').removeClass('initial');

            } else {

                $('#content-map-canvas').remove();

                $('<div/>', {
                    id: 'content-map-canvas',
                }).appendTo('#results-container');

                // create an instance of the model with a collection
                var map = new App.Models.Map({
                    markers: resultsCollection
                });

                // create an instance of the view
                var addMapView = new App.Views.MapView({model:map});

                // render the map
                addMapView.render(data);

            }
        },

        events: {
            'click a#list-view': 'listView',
            'click a#map-view': 'mapView'
        },

        listView: function(data){
            $('#data-results').removeClass('hidden');
            $('#content-map-canvas').addClass('hidden');
        },

        mapView: function(data){
            $('#data-results').addClass('hidden');
            $('#content-map-canvas').removeClass('hidden');
        },

        render: function(){
            this.$el.html((this.template));
            return this;
        }
    });

    App.Models.Map = Backbone.Model.extend({

    });

    App.Models.Marker = Backbone.Model.extend({
        defaults: {
            id: null,
            result_type: 'result_type',
            user: 'user',
            user_full_name: 'user_full_name',
            link: 'link',
            image_source: 'image_source',
            caption: 'caption',
            latitude: 47.601146851,
            longitude: -122.334979731,
            time_date: 'time_date'
        }
    });

    App.Collections.Markers = Backbone.Collection.extend({
        model:App.Models.Marker
    });

    App.Views.MarkerView = Backbone.View.extend({

        template: template('data-results-template'),

        initialize: function(options) {

            var myIcon = L.Icon.extend({
                iconUrl: null,
                iconSize: [38, 95],
                iconAnchor: [22, 94],
                popupAnchor: [-3, -76]
            });

            if (this.model.attributes.result_type === 'instagram'){
                this.marker = L.marker([this.model.get('latitude'), this.model.get('longitude')], {icon: new myIcon({iconUrl: 'static/images/new-instagram-logo.png'})});
            } else {
                this.marker = L.marker([this.model.get('latitude'), this.model.get('longitude')], {icon: new myIcon({iconUrl: 'static/images/new-twitter-logo.png'})});
            }

            this.map = options.map;
            this.marker.addTo(this.map);
            var that = this;
            this.marker.on('click', function(){
                $('#content-background').css({'opacity' : '0.7'}).fadeIn('fast');
                $('#content-display').html(that.template(that.model.attributes)).append('<button type="button"class="btn btn-danger btn-group btn-group-justified" id="close">Close</button>').fadeIn('slow');

                $('#close').click(function(){
                    $('#content-display').fadeOut('fast');
                    $('#content-background').fadeOut('fast');
                });

            	$('#content-background').click(function(){
            		$('#content-background').fadeOut('slow');
            		$('#content-display').fadeOut('slow');
            	});

            	$(document).keydown(function(e){
            		if(e.keyCode==27) {
            			$('#content-background').fadeOut('slow');
            			$('#content-display').fadeOut('slow');
            		}
            	});
            });
        }
    });

    App.Views.MapView = Backbone.View.extend({
        id: '#content-map-canvas',

        render: function(data) {

            var map = this.map = L.map('content-map-canvas', {
                scrollWheelZoom: false,
                zoomControl: true
            });

            var center = new L.LatLng(data.geolatitude, data.geolongitude);

            map.setView(center, data.zoom);

            L.tileLayer('http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
                attribution: 'Tiles, data, imagery and map information provided by <a href="http://www.mapquest.com" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">, <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and OpenStreetMap contributors.',
                subdomains: ['otile1','otile2','otile3','otile4']
            }).addTo(map);

            // render each of the markers
            this.markerViews = this.model.get('markers').map(function(marker) {
                return new App.Views.MarkerView({model:marker, map:map}).render();
            });
        },
    });

    var renderPage = new App.Views.InitPage();
    $('#content-header').append(renderPage.render().el);
})();