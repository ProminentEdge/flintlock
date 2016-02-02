'use strict';

(function() {
  angular.module('fireStation', [
      'ngResource',
      'ui.bootstrap',
      'fireStation.factories',
      'fireStation.homeController',
      'fireStation.departmentDetailController',
      'fireStation.performanceScoreController',
      'fireStation.mapService',
      'fireStation.shelterService',
      'fireStation.formService',
      'fireStation.gauge',
      'fireStation.search',
      'fireStation.graphs',
      'fireStation.forms',
      'fireStation.report'
  ])

  .config(function($interpolateProvider, $httpProvider, $resourceProvider) {
    $interpolateProvider.startSymbol('{[');
    $interpolateProvider.endSymbol(']}');
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $resourceProvider.defaults.stripTrailingSlashes = false;
  })

})();

