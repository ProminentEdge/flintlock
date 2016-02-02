'use strict';

(function() {
    var q_ = null;
    var http_ = null;
    angular.module('fireStation.formService', [])

    .provider('formService', function() {
        var forms = null;
        this.$get = function($q, $http) {
          q_ = $q;
          http_ = $http;
          return this;
        };

        this.getForms = function(forceUpdate) {
          var deferredResponse = q_.defer();
          if (forms === null || forceUpdate) {
            http_.get('/api/v1/form').then(function(response) {
              forms = response.data.objects;
              forms.forEach(function(form) {
                form.schema = JSON.parse(form.schema);
              });
              deferredResponse.resolve(forms);
            }, function(error) {
              deferredResponse.reject(error);
            });
          } else {
            deferredResponse.resolve(forms);
          }
          return deferredResponse.promise;
        };
  });


})();
