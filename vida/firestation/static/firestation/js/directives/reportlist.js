'use strict';

(function() {
  var module = angular.module('fireStation.reportList', []);

  module.directive('reportList',
      function($filter, reportService, formService, NgTableParams, map) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report-list.tpl.html',
          link: function(scope, element, attrs) {
            scope.reports = null;
            scope.columns = [
                { title: 'Location', field: '', visible: true, class: 'location-column' },
                { title: 'Form', field: 'formTitle', visible: true, class: 'form-column' },
                { title: 'Outstation', field: 'outstation', visible: true, class: 'outstation-column' },
                { title: 'User', field: 'user.username', visible: true, class: 'user-column' },
                { title: 'Timestamp', field: 'timestamp', visible: true, class: 'timestamp-column' },
                { title: 'Status', field: 'status', visible: true, class: 'status-column' },
                { title: 'View', field: '', visible: true, class: 'view-column'}
            ];
            scope.filters = {
              formTitle: '',
              username: '',
              status: '',
              timestamp: '',
              outstation: ''
            };
            formService.getForms().then(function(forms) {
              scope.forms = forms;
            });
            scope.mapLayer = L.layerGroup();
            scope.mapLayer.addTo(map.map);
            var markers = {};
            var markerClickEvents = {};

            scope.$on('reportsUpdated', function() {
              scope.reports = reportService.reports;
              scope.reports.forEach(function(report) {
                report.outstation = '';
                for (var prop in report.data) {
                  if (report.data.hasOwnProperty(prop) && prop.toLowerCase().indexOf('outstation') >= 0) {
                    report.outstation = report.data[prop];
                    break;
                  }
                }
                if (report.geom) {
                  if (!markers[report.id]) {
                   setupMarkers(report);
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
            });

            scope.$on('pickingLocationStart', function() {
              for (var prop in markers) {
                if (markers.hasOwnProperty(prop)) {
                  markers[prop].off('click', markerClickEvents[prop]);
                }
              }
            });

            scope.$on('pickingLocationEnd', function() {
              for (var prop in markers) {
                if (markers.hasOwnProperty(prop)) {
                  markers[prop].on('click', markerClickEvents[prop]);
                }
              }
            });

            scope.refreshReports = function() {
              reportService.getReports();
            };

            scope.refreshReports();

            scope.$watch('filters', function() {
              if (scope.reports) {
                scope.reports.forEach(function (report) {
                  if (markers[report.id]) {
                    scope.mapLayer.removeLayer(markers[report.id]);
                    if (!scope.isFiltered(report)) {
                      setupMarkers(report);
                    }
                  }
                });
              }
            }, true);

            var matchesTimestamp = function(report) {
              var msAgo = new Date().getTime() - new Date(report.timestamp).getTime();
              if (scope.filters.timestamp === '24HRS') {
                // Less than millis per day?
                return msAgo < 1000 * 60 * 60 * 24;
              } else if (scope.filters.timestamp === 'WEEK') {
                // Less than millis per week?
                return msAgo < 1000 * 60 * 60 * 24 * 7;
              }
              return false;
            };

            scope.isFiltered = function(report) {
              return (scope.filters.formTitle && report.formTitle !== scope.filters.formTitle) ||
                        (scope.filters.status && report.status !== scope.filters.status) ||
                        (scope.filters.username && report.user.username.indexOf(scope.filters.username) < 0) ||
                        (scope.filters.outstation && report.outstation.indexOf(scope.filters.outstation) < 0) ||
                        (scope.filters.timestamp && !matchesTimestamp(report));
            };

            scope.formatTimestamp = function(timestamp) {
              return $filter('date')(timestamp,'MM/dd/yyyy, HH:mm');
            };

            scope.viewReport = function(report) {
              reportService.viewReport(angular.copy(report), true);
            };

            scope.goToLocation = function(report) {
              map.map.setView([report.geom.coordinates[1], report.geom.coordinates[0]], 15);
            };


            var setupMarkers = function(report) {
              markers[report.id] = new L.marker(new L.LatLng(report.geom.coordinates[1], report.geom.coordinates[0]), {
                icon: formService.getFormByURI(report.form).icon,
                clickable: true,
                opacity: 1,
                riseOnHover: true
              });
              markerClickEvents[report.id] = function () {
                scope.viewReport(report);
              };
              markers[report.id].on('click', markerClickEvents[report.id]);
              scope.mapLayer.addLayer(markers[report.id]);
            }
          }
        };
      });
}());


