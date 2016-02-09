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
        this.reports = [];
        this.currentUser = null;
        var latestTime = new Date(0);
        var reportRequest = null;
        this.$get = function($rootScope, $q, $http, $modal, map, formService) {
          q_ = $q;
          http_ = $http;
          mapService = map;
          formService_ = formService;
          rootScope_ = $rootScope;
          modal_ = $modal;
          return this;
        };

        this.getReports = function() {
          if (reportRequest) {
            return reportRequest.promise;
          }
          reportRequest = q_.defer();
          var context = this;
          formService_.getForms().then(function() {
            http_.get('/api/v1/report/?limit=0&modified__gt=' + latestTime.toISOString()).then(function(response) {
              response.data.objects.reverse().forEach(function(report) {
                var modifiedDate = new Date(report.modified);
                if (modifiedDate > latestTime) {
                  latestTime = modifiedDate;
                }
                context.updateReport(report, true);
              });
              reportRequest.resolve(context.reports);
              rootScope_.$broadcast('reportsUpdated');
              reportRequest = null;
            }, function(error) {
              reportRequest.reject(error);
              reportRequest = null;
            });
          }, function(error) {
            console.log('Unable to load forms:', error);
          });
          return reportRequest.promise;
        };

        this.updateReport = function(report, suppressBroadcast) {
          var replaced = false;
          var context = this;
          var form = formService_.getFormByURI(report.form);
          report.formTitle = form ? form.schema.title : report.form;
          report.modified = new Date(report.modified).toISOString();
          report.timestamp = new Date(report.timestamp).toISOString();
          for (var prop in form.schema.properties) {
            if (form.schema.properties.hasOwnProperty(prop) &&
                form.schema.properties[prop].type === 'datetime' &&
                report.data[prop]) {
              report.data[prop] = new Date(report.data[prop]);
            }
          }
          for (var i = 0; i < context.reports.length; i++) {
            if (context.reports[i].id === report.id) {
              context.reports[i] = report;
              replaced = true;
              console.log('replaced!');
            }
          }
          if (!replaced) {
            context.reports.unshift(report);
          }
          if (!suppressBroadcast) {
            rootScope_.$broadcast('reportsUpdated');
          }
        };

        this.viewReport = function(report, showStatus) {
          var form = formService_.getFormByURI(report.form);
          var modalScope = rootScope_.$new();
          modalScope.form = form;
          modalScope.showStatus = showStatus;
          modalScope.report = report;
          modalScope.canApprove = this.currentUser && this.currentUser.is_superuser;
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

        this.setCurrentUser = function(user) {
          this.currentUser = user;
        };
  });


})();
