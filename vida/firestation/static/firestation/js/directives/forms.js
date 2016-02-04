'use strict';

(function() {
  var module = angular.module('fireStation.forms', []);

  module.directive('formsList',
      function($http, formService, reportService, map) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/forms.tpl.html',
          link: function(scope) {
            scope.forms = [];
            scope.ready = false;
            scope.selectLocationCancel = null;
            scope.status = {
              isopen: false
            };
            formService.getForms().then(function(forms) {
              scope.forms = forms;
              scope.ready = true;
            }, function(error) {
              console.log('ERROR!', error);
            });

            scope.toggleDropdown = function(e) {
              e.preventDefault();
              e.stopPropagation();
              scope.status.isopen = !$scope.status.isopen;
            };

            scope.createReportGeo = function(form) {
              var marker = new L.marker(new L.LatLng(0, 0)).addTo(map.map);
              scope.ready = false;
              var updateMarker = function(e) {
                marker.setLatLng(e.latlng)
              };
              var pickPoint = function(e) {
                scope.selectLocationCancel();
                scope.createReport(form, {
                  coordinates: [
                    e.latlng.lng,
                    e.latlng.lat
                  ],
                  type: 'Point'
                });
              };
              scope.selectLocationCancel = function() {
                map.map.off('click', pickPoint);
                map.map.off('mousemove', updateMarker);
                if (!scope.$$phase) {
                  scope.$apply(function () {
                    scope.ready = true;
                    scope.selectLocationCancel = null;
                  });
                } else {
                  scope.ready = true;
                  scope.selectLocationCancel = null;
                }
                map.map.removeLayer(marker);
              };
              map.map.on('click', pickPoint);
              map.map.on('mousemove', updateMarker);
            };

            scope.createReport = function(form, geom) {
              if (!geom) {
                geom = {
                  coordinates: [0, 0],
                  type: 'Point'
                };
              }
              reportService.viewReport({
                timestamp_local: new Date(),
                data: {},
                geom: geom,
                form: form.resource_uri,
                status: 'SUBMITTED'
              }, false);
            };
          }
        };
      });
}());


