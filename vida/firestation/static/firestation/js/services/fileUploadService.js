(function() {
  var q_ =null;
  var http_ = null;
  angular.module('fireStation.fileUploadService', [])

  .provider('fileUpload', function() {
    this.$get = function($q, $http) {
      q_ = $q;
      http_ = $http;
      return this;
    };

    this.uploadFileToUrl = function (file, uploadUrl) {
      var deferredResponse = q_.defer();
      var formData = new FormData();
      formData.append('file', file);
      http_.post(uploadUrl, formData, {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      }).success(function (response) {
        if (response.name !== undefined && response.name !== null) {
          deferredResponse.resolve(response);
        } else {
          deferredResponse.reject(response);
        }
      }).error(function () {
        deferredResponse.reject('There was problem uploading the file. Please check your network connectivity and try again.');
      });
      return deferredResponse.promise;
    };
  });
})();