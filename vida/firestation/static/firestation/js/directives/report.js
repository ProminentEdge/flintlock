'use strict';

(function() {
  var module = angular.module('fireStation.report', []);

  module.directive('reportDialog',
      function($http) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report.tpl.html',
          link: function(scope, element, attrs) {
            scope.ok = function() {
              var payload = {
                'timestamp_local': new Date(),
                'data': scope.report,
                'geom': scope.geom,
                'form': scope.form.resource_uri
              };
              $http.post('/api/v1/report/', JSON.stringify(payload)).then(function() {
                scope.$close();
              }, function(error) {
                console.log('Failed to send report: ', error);
              });
            };
            scope.cancel = function() {
              scope.$close();
            };
          }
        };
      });
}());


