'use strict';

(function() {
    var q_ = null;
    var http_ = null;
    var mapService = null;
    var formService_ = null;
    var rootScope_ = null;
    var modal_ = null;
    angular.module('fireStation.reportService', [])

    .provider('reportService', function() {
        var reports = null;
        this.$get = function($rootScope, $q, $http, $modal, map, formService) {
          q_ = $q;
          http_ = $http;
          mapService = map;
          formService_ = formService;
          rootScope_ = $rootScope;
          modal_ = $modal;
          return this;
        };

        this.getReports = function(forceUpdate) {
          var deferredResponse = q_.defer();
          if (reports === null || forceUpdate) {
            formService_.getForms().then(function() {
              http_.get('/api/v1/report?limit=0').then(function(response) {
                console.log(response);
                reports = response.data.objects;
                reports.forEach(function(report) {
                  var form = formService_.getFormByURI(report.form);
                  report.formTitle = form ? form.schema.title : report.form;
                  for (var prop in form.schema.properties) {
                    if (form.schema.properties.hasOwnProperty(prop) &&
                        form.schema.properties[prop].type === 'datetime' &&
                        report.data[prop]) {
                      report.data[prop] = new Date(report.data[prop]);
                    }
                  }
                });
                deferredResponse.resolve(reports);
              }, function(error) {
                deferredResponse.reject(error);
              });
            }, function(error) {
              console.log('Unable to load forms:', error);
            });
          } else {
            deferredResponse.resolve(reports);
          }
          return deferredResponse.promise;
        };

        this.viewReport = function(report, showStatus) {
          var form = formService_.getFormByURI(report.form);
          var modalScope = rootScope_.$new();
          modalScope.form = form;
          modalScope.showStatus = showStatus;
          modalScope.report = report;
          var modalInstance = modal_.open({
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
  });


})();
