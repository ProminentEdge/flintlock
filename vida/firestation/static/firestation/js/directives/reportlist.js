'use strict';

(function() {
  var module = angular.module('fireStation.reportList', []);

  module.directive('reportList',
      function($filter, $rootScope, reportService, formService, NgTableParams, map, filterService) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report-list.tpl.html',
          link: function(scope, element, attrs) {
            scope.reports = null;
            scope.columns = [
                { title: 'Location', field: '', visible: true, class: 'location-column' },
                { title: 'Form', field: 'formTitle', visible: true, class: 'form-column' },
                { title: 'From', field: 'from', visible: true, class: 'from-column' },
                { title: 'User', field: 'user.username', visible: true, class: 'user-column' },
                { title: 'Created', field: 'timestamp', visible: true, class: 'timestamp-column' },
                { title: 'Updated', field: 'modified', visible: true, class: 'timestamp-column' },
                { title: 'Status', field: 'status', visible: true, class: 'status-column' },
                { title: 'View', field: '', visible: true, class: 'view-column'}
            ];
            scope.filters = {
              formTitle: '',
              username: '',
              status: '',
              timestamp: '',
              modified: '',
              from: '',
              hideAll: false
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
                report.from = '';
                for (var prop in report.data) {
                  if (report.data.hasOwnProperty(prop) && prop.toLowerCase() === 'from') {
                    report.from = report.data[prop];
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
                count: 100
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
                  var filtered_reports = [];

                  filterService.resetFilters();

                scope.reports.forEach(function (report) {
                  if (markers[report.id]) {
                    scope.mapLayer.removeLayer(markers[report.id]);
                    if (!scope.isFiltered(report)) {
                      filterService.setFilters(report);
                      setupMarkers(report);

                      filtered_reports.push(report);
                    }
                  }
                });

                scope.tableParams = new NgTableParams({
                  page: 1,
                  count: 10
                }, {
                  total: filtered_reports.length,
                  data: filtered_reports
                });
              }
            }, true);

            var matchesTimestamp = function(report, field) {
              var msAgo = new Date().getTime() - new Date(report[field]).getTime();
              if (scope.filters[field] === '24HRS') {
                // Less than millis per day?
                return msAgo < 1000 * 60 * 60 * 24;
              } else if (scope.filters[field] === 'WEEK') {
                // Less than millis per week?
                return msAgo < 1000 * 60 * 60 * 24 * 7;
              }
              return false;
            };

            scope.isFiltered = function(report) {
              return scope.filters.hideAll ||
                  (scope.filters.formTitle && report.formTitle !== scope.filters.formTitle) ||
                  (scope.filters.formTitle && scope.filters.formTitle === "none") ||
                  (scope.filters.status && report.status !== scope.filters.status) ||
                  (scope.filters.username && report.user.username.indexOf(scope.filters.username) < 0) ||
                  (scope.filters.from && report.from.indexOf(scope.filters.from) < 0) ||
                  (scope.filters.timestamp && !matchesTimestamp(report, 'timestamp') ||
                  (scope.filters.modified && !matchesTimestamp(report, 'modified')));
            };

            scope.formatTimestamp = function(timestamp) {
              return $filter('date')(timestamp,'MM/dd/yyyy, HH:mm');
            };

            scope.viewReport = function(report) {
              reportService.viewReport(angular.copy(report), true, report);
            };

            scope.goToLocation = function(report) {
              map.map.setView([report.geom.coordinates[1], report.geom.coordinates[0]], 15);
            };

            scope.$on('filterAllReports', function(event, filterAllReports) {
              scope.filters.hideAll = filterAllReports;
            });

            scope.$on('viewReportFromFeature', function (event, args) {
              scope.viewReport(args.report);
            });

            var setupMarkers = function(report) {
                $rootScope.$broadcast('filtersTable', {reports: scope.reports});
                markers[report.id] = new L.RegularPolygonMarker(new L.LatLng(report.geom.coordinates[1], report.geom.coordinates[0]), {
                    color: formService.getFormByURI(report.form).color,
                    opacity: 1,
                    weight: 1,
                    fillColor: formService.getFormByURI(report.form).color,
                    fillOpacity: 1,
                    numberOfSides: 3,
                    rotation: 90,
                    radius: 16,
                    clickable:false
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


