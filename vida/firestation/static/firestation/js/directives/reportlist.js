'use strict';

(function() {
  var module = angular.module('fireStation.reportList', []);

  module.directive('reportList',
      function(reportService, formService, NgTableParams, map) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report-list.tpl.html',
          link: function(scope, element, attrs) {
            scope.reports = null;
            scope.columns = [
                { title: 'Location', field: 'location', visible: true, class: 'location-column' },
                { title: 'Form', field: 'formTitle', visible: true, filter: {'formTitle': 'text'}, class: 'form-column' },
                { title: 'User', field: 'user', visible: true, filter: {'user': 'text'}, class: 'user-column' },
                { title: 'Timestamp', field: 'timestamp', visible: true, class: 'timestamp-column' },
                { title: 'Status', field: 'status', visible: true, class: 'status-column' },
                { title: 'View', field: '', visible: true, class: 'view-column'}
            ];
            scope.filters = {
              formTitle: '',
              user: '',
              status: ''
            };
            formService.getForms().then(function(forms) {
              scope.forms = forms;
            });
            scope.mapLayer = L.layerGroup();
            scope.mapLayer.addTo(map.map);
            scope.markers = {};

            scope.refreshReports = function() {
              reportService.getReports(true).then(function(reports) {
                scope.reports = reports;
                scope.reports.forEach(function(report) {
                  if (report.geom) {
                    if (!scope.markers[report.id]) {
                      scope.markers[report.id] = new L.marker(new L.LatLng(report.geom.coordinates[1], report.geom.coordinates[0]), {
                        icon: formService.getFormByURI(report.form).icon,
                        clickable: true
                      });
                      scope.markers[report.id].on('click', function () {
                        scope.viewReport(report);
                      });
                      scope.mapLayer.addLayer(scope.markers[report.id]);
                    }
                  }
                });
                scope.tableParams = new NgTableParams({
                  page: 1,
                  count: 10
                }, {
                  total: scope.reports.length,
                  data: scope.reports
                });
              }, function(error) {
                console.log('Failed to get reports: ', error);
              });
            };

            scope.refreshReports();

            scope.$watch('filters', function() {
              if (scope.reports) {
                var filters = scope.filters;
                scope.reports.forEach(function (report) {
                  if (scope.markers[report.id]) {
                    if ((filters.formTitle && report.formTitle !== filters.formTitle) ||
                        (filters.status && report.status !== filters.status) ||
                        (filters.user && report.user.indexOf(filters.user) < 0)) {
                      scope.markers[report.id].setOpacity(0);
                    } else {
                      scope.markers[report.id].setOpacity(1);
                    }
                  }
                });
              }
            }, true);

            scope.formatTimestamp = function(timestamp) {
              return new Date(timestamp).toLocaleString();
            };

            scope.viewReport = function(report) {
              reportService.viewReport(angular.copy(report), true);
            };

            scope.goToLocation = function(report) {
              map.map.setView([report.geom.coordinates[1], report.geom.coordinates[0]], 15);
            };
          }
        };
      });
}());


