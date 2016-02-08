'use strict';

(function() {
    angular.module('fireStation.mapService', [])

    .provider('map', function() {
        this.map = null;
        this.layerControl = null;
        this.$get = function($rootScope) {
          return this;
        };

        this.addBaseLayers = function(map) {
            if (map==null) {
                return
            }

            var vector = L.tileLayer('https://{s}.tiles.mapbox.com/v3/garnertb.m9pm846a/{z}/{x}/{y}.png',
              {'attribution': '© Mapbox', 'opacity':.95});


            var satelliteLayer = L.tileLayer('https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZ2FybmVydGIiLCJhIjoiNW5ZYkExNCJ9.sIFdyxQ4n1UQFEenEJ1RGg',
              {'attribution': '© Mapbox', 'opacity':.95});

            vector.addTo(map);

            return {'Basemap': vector, 'Imagery': satelliteLayer}

        };

        this.initMap = function(div, options) {
            var defaultOptions = {
              boxZoom: true,
              zoom: 15,
              zoomControl: true,
              attributionControl: false,
              scrollWheelZoom: false,
              doubleClickZoom: false,
              fullscreenControl: false
            };

            angular.extend(defaultOptions, options);
            this.map = L.map(div, options);
            this.map.setView([16.636, -13.711], 5);
            var hash = new L.Hash(this.map);
            var baseLayers = this.addBaseLayers(this.map);
            this.layerControl = L.control.layers(baseLayers).addTo(this.map);
            return this.map;

        }
  });


})();
