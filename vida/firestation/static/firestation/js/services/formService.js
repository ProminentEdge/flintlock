'use strict';

(function() {
    var q_ = null;
    var http_ = null;
    angular.module('fireStation.formService', [])

    .provider('formService', function() {
        var forms = null;
        var formsRequest = null;
        this.$get = function($q, $http) {
          q_ = $q;
          http_ = $http;
          return this;
        };

        this.getForms = function(forceUpdate) {
          if (formsRequest) {
            return formsRequest.promise;
          }
          formsRequest = q_.defer();
          if (forms === null || forceUpdate) {
            http_.get('/api/v1/form').then(function(response) {
              forms = response.data.objects;
              forms.forEach(function(form) {
                form.schema = JSON.parse(form.schema);
              });
              formsRequest.resolve(forms);
            }, function(error) {
              formsRequest.reject(error);
            });
          } else {
            formsRequest.resolve(forms);
          }
          return formsRequest.promise;
        };

        this.getFormByURI = function(formURI) {
          if (forms) {
            for (var i = 0; i < forms.length; i++) {
              if (forms[i].resource_uri === formURI) {
                return forms[i];
              }
            }
          }
          return null;
        }
  });


})();
