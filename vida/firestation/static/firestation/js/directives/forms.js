'use strict';

(function() {
  var module = angular.module('fireStation.forms', []);

  module.directive('formsList',
      function($http, formService, $modal, map) {
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
                scope.createReport(form, "SRID=4326;POINT (" + e.latlng.lng + " " + e.latlng.lat + ")");
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
              var modalScope = scope.$new();
              modalScope.form = form;
              modalScope.report = {};
              modalScope.geom = geom;
              var modalInstance = $modal.open({
                animation: true,
                backdrop: 'static',
                template: '<report-dialog></report-dialog>',
                scope: modalScope
              });

              modalInstance.result.then(function () {
              }, function () {
                console.log('Modal dismissed at: ' + new Date());
              });
            };
          }
        };
      });
}());


