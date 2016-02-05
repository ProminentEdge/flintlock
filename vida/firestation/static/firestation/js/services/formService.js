'use strict';

(function() {
    var q_ = null;
    var http_ = null;
    angular.module('fireStation.formService', [])

    .provider('formService', function() {
        var forms = null;
        var formsRequest = null;
        var formURIMap = {};
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
                form.icon = L.VectorMarkers.icon({
                  icon: 'circle',
                  markerColor: form.color
                });
                formURIMap[form.resource_uri] = form;
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
          return formURIMap[formURI];
        }
  });


})();
