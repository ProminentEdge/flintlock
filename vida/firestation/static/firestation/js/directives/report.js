'use strict';

(function() {
  var module = angular.module('fireStation.report', []);

  module.directive('reportDialog',
      function($http, $sce) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/partial/report.tpl.html',
          link: function(scope, element, attrs) {
            scope.context = {
              noteField: ''
            };
            scope.ok = function() {
              var postFunc = $http.post;
              if (scope.showStatus) {
                postFunc = $http.put;
              }
              postFunc('/api/v1/report/' + (scope.showStatus ? scope.report.id + '/' : ''), JSON.stringify(scope.report)).then(function() {
                scope.$close();
              }, function(error) {
                console.log('Failed to send report: ', error);
              });
            };
            scope.cancel = function() {
              scope.$close();
            };
            scope.addNote = function() {
              var payload = {
                note: scope.context.noteField,
                report__id: scope.report.id
              };
              $http.post('/api/v1/note/', JSON.stringify(payload)).then(function() {
                scope.report.notes.unshift({
                  author: {
                    username: 'admin'
                  },
                  created: new Date().toISOString(),
                  note: scope.context.noteField
                });
                scope.context.noteField = '';
              }, function(error) {
                console.log('Failed to post note: ', error);
              });
            };

            scope.formatTimestamp = function(timestamp) {
              return '@ ' + new Date(timestamp).toLocaleString();
            };

            scope.getHtml = function(str) {
              return $sce.trustAsHtml(str);
            };
          }
        };
      });
}());


