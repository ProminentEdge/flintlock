'use strict';

(function() {
  var module = angular.module('fireStation.report', []);

  module.directive('reportDialog',
      function($http, $sce, $filter, reportService) {
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
              postFunc('/api/v1/report/' + (scope.showStatus ? scope.report.id + '/' : ''), JSON.stringify(scope.report)).then(function(response) {
                reportService.updateReport(response.data);
                scope.$close();
              }, function(error) {
                console.log('Failed to send report: ', error);
              });
            };
            scope.cancel = function() {
              scope.$close();
            };
            scope.addNote = function() {
              if (scope.context.noteField == null || scope.context.noteField === "") {
                  return;
              }
              var payload = {
                note: scope.context.noteField,
                report__id: scope.report.id
              };
              $http.post('/api/v1/note/', JSON.stringify(payload)).then(function(note) {
                scope.report.notes.unshift(note.data);
                scope.context.noteField = '';
              }, function(error) {
                console.log('Failed to post note: ', error);
              });
            };
            scope.getMediaProp = function() {
              for (var i = 0; i < scope.form.schema.properties.length; i++) {
                if (scope.form.schema.properties[i].name.toLowerCase() === 'photos') {
                  return scope.form.schema.properties[i].name;
                }
              }
              return null;
            };
            var mediaProp = scope.getMediaProp();
            scope.photos = [];
            if (mediaProp && scope.report.data[mediaProp]) {
              scope.report.data[mediaProp].forEach(function(photo) {
                scope.photos.push({
                  url: '/api/v1/fileservice/' + photo + '/view',
                  thumbUrl: '/api/v1/fileservice/' + photo + '/view'
                });
              });
            }

            scope.openPhoto = function (photo) {
              var win = window.open(photo.url, '_blank');
              win.focus();
            };

            scope.formatTimestamp = function(timestamp) {
              return '@ ' + $filter('date')(new Date(timestamp),'MM/dd/yyyy, HH:mm');
            };

            scope.getHtml = function(str) {
              return $sce.trustAsHtml(str);
            };
          }
        };
      });
}());


