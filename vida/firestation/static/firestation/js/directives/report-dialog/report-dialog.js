'use strict';

(function () {
  var module = angular.module('fireStation.report', []);

  module.directive('reportDialog',
      function ($http, $sce, $filter, reportService) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/report-dialog/report-dialog.tpl.html',
          link: function (scope, element, attrs) {
            scope.checkBox={};
            scope.duplicatedNode = [];
            var duplicateReport={}, duplicatePhoto = [];
            scope.context = {
              noteField: '',
              isValidDateTime:true,
              isDuplicate:false,
              noteDuplicatedField:''
            };
            scope.ok = function () {
              if (scope.unsavedNote()) {
                  scope.addNote();
              }
              var postFunc = $http.post;
              if (scope.showStatus) {
                postFunc = $http.put;
              }
              postFunc('/api/v1/report/' + (scope.showStatus ? scope.report.id + '/' : ''), JSON.stringify(scope.report)).then(function (response) {
                reportService.updateReport(response.data);
                scope.cancel();
              }, function (error) {
                console.log('Failed to send report: ', error);
              });
            };
            scope.cancel = function () {
              scope.$close();
            };

            scope.isPhoto = function(fileName) {
              return (/\.(gif|jpg|jpeg|tiff|png)$/i).test(fileName.toLowerCase());
            };

            scope.unsavedNote = function() {
              return scope.context.noteField != null && scope.context.noteField !== "";
            };

            scope.addNote = function () {
              if (!scope.unsavedNote()) {
                  return;
              }
              var payload = {
                note: scope.context.noteField,
                report__id: scope.report.id
              };
              $http.post('/api/v1/note/', JSON.stringify(payload)).then(function (note) {
                scope.report.notes.unshift(note.data);
                if (scope.originalReport) {
                  scope.originalReport.notes.unshift(note.data);
                  scope.originalReport.modified = new Date(note.data.created);
                }
                scope.context.noteField = '';
              }, function (error) {
                console.log('Failed to post note: ', error);
              });
            };
            scope.getMediaProp = function () {
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
              scope.report.data[mediaProp].forEach(function (photo) {
                scope.photos.push({
                  url: '/api/v1/fileservice/' + photo + (scope.isPhoto(photo) ? '/view' : '/download'),
                  thumbUrl: '/api/v1/fileservice/' + photo + '/view',
                  name: photo
                });
              });
            }

            scope.openPhoto = function (photo) {
              var win = window.open(photo.url, '_blank');
              win.focus();
            };

            scope.formatTimestamp = function (timestamp) {
              return '@ ' + $filter('date')(new Date(timestamp), 'MM/dd/yyyy, HH:mm');
            };

            scope.getHtml = function (str) {
              return $sce.trustAsHtml(str);
            };

            scope.$on('file-upload-success', function(event, data) {
              if (!scope.report.data[mediaProp]) {
                scope.report.data[mediaProp] = [];
              }
              scope.report.data[mediaProp].push(data);
              scope.photos.push({
                url: '/api/v1/fileservice/' + data + (scope.isPhoto(data) ? '/view' : '/download'),
                thumbUrl: '/api/v1/fileservice/' + data + '/view',
                name: data
              });
            });

            scope.duplicate = function(){

              if(!scope.context.isDuplicate) {

                duplicateReport = angular.copy(scope.report);
                duplicatePhoto = angular.copy(scope.photos);
                for (var i = 0; i < scope.form.schema.properties.length; i++) {
                  scope.checkBox[scope.form.schema.properties[i].name] = true;
                }
                scope.report.status = "SUBMITTED";
                scope.report.data.photos = [];
                scope.photos = [];
                scope.report.notes = [];
              }else {
                scope.report = duplicateReport;
                scope.photos = duplicatePhoto;
              }
                scope.context.isDuplicate = !scope.context.isDuplicate;
                scope.showStatus = !scope.showStatus;
                scope.duplicatedNode = [];
                scope.context.noteDuplicatedField='';

            };

            scope.addDuplicateNote = function() {
                scope.duplicatedNode.push(scope.context.noteDuplicatedField);
                scope.context.noteDuplicatedField='';
            };

             scope.saveDuplicatedNote = function (reportId) {
               var payload = [];
               angular.forEach(scope.duplicatedNode, function(duplicatedNode){
                  payload = {
                    note: duplicatedNode,
                    report__id: reportId
                  };


              $http.post('/api/v1/note/', JSON.stringify(payload)).then(function (note) {
                scope.report.data.notes.unshift(note.data);
                reportService.updateReport(scope.report.data);
                scope.noteDuplicatedField = [];

              }, function (error) {
                console.log('Failed to post note: ', error);
              });
               });
             };

            scope.saveDuplicate = function(){
               angular.forEach(scope.checkBox, function(value, key){
                if(!value) {
                  scope.report.data[key] = null;
                }
              });
              delete scope.report.id;
              scope.report.user = null;
              $http.post('/api/v1/report/', JSON.stringify(scope.report)).then(function (response) {
                scope.report.data = response.data;
                if (scope.duplicatedNode.length>0) {
                  scope.saveDuplicatedNote(scope.report.data.id);
                }else{
                  reportService.updateReport(scope.report.data);

                }
                  scope.cancel();
              }, function (error) {
                console.log('Failed to send report: ', error);
              });


              scope.context.isDuplicate = !scope.context.isDuplicate;

            };
            scope.isUploading = false;

            scope.$on('begin-uploading', function() {
              scope.isUploading = true;
            });

            scope.$on('end-uploading', function() {
              scope.isUploading = false;
            });

          }
        };
      });

  module.directive('fileModel',
      function ($parse, fileUpload, $rootScope) {
        return {
          restrict: 'A',
          link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
              scope.$apply(function () {
                var files = element[0].files;
                modelSetter(scope, element[0].files[0]);
                scope.hasUploadFile = true;
                var numberOfUploads = 0;

                var onSuccess = function (response) {
                  $rootScope.$broadcast('file-upload-success', response.name);
                  numberOfUploads--;
                  if (numberOfUploads === 0) {
                    $rootScope.$broadcast('end-uploading');
                  }
                };

                var onReject = function (reject) {
                  console.log(reject);
                  window.alert(reject);
                  numberOfUploads--;
                  if (numberOfUploads === 0) {
                    $rootScope.$broadcast('end-uploading');
                  }
                };

                for (var i = 0; i < files.length; i++) {
                  var file = files[i];
                  $rootScope.$broadcast('begin-uploading');
                  if (file !== undefined && file !== null) {
                    numberOfUploads++;
                    fileUpload.uploadFileToUrl(file, '/api/v1/fileservice/').then(onSuccess, onReject);
                  }
                }
              });
            });
          }
        };
      });
}());


