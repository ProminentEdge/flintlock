'use strict';

(function() {
  var module = angular.module('fireStation.reportList', []);

  module.directive('reportList',
      function(reportService, formService, NgTableParams) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report-list.tpl.html',
          link: function(scope, element, attrs) {
            scope.reports = null;
            scope.columns = [
                { title: 'Location', field: 'location', visible: true, class: 'location-column' },
                { title: 'Form', field: 'formTitle', visible: true, filter: {'formTitle': 'text'}, class: 'form-column' },
                //{ title: 'User', field: 'user', visible: true, filter: {'form': 'user'}, class: 'user-column' },
                { title: 'Timestamp', field: 'timestamp', visible: true, class: 'timestamp-column' },
                { title: 'Status', field: 'status', visible: true, class: 'status-column' },
                { title: 'View', field: '', visible: true, class: 'view-column'}
            ];

            scope.refreshReports = function() {
              reportService.getReports(true).then(function(reports) {
                scope.reports = reports;
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

            scope.formatTimestamp = function(timestamp) {
              return new Date(timestamp).toLocaleString();
            };

            scope.viewReport = function(report) {
              reportService.viewReport(angular.copy(report), true);
            };

            scope.goToLocation = function(report) {
              console.log('Go to the location of report: ', report);
            };
          }
        };
      });
}());


