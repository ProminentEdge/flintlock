'use strict';

(function() {
  var module = angular.module('fireStation.userList', []);

  module.directive('userList',
      function($rootScope) {
        return {
          restrict: 'E',
          replace: true,
          scope: {
            users: '='
          },
          templateUrl: '/static/firestation/js/directives/partial/user-list.tpl.html',
          link: function(scope, element, attrs) {
            scope.ready = false;
            scope.status = {
              isopen: false
            };
            scope.search = '';

            scope.$watch('users', function() {
              if (scope.users.length > 0) {
                console.log(scope.users);
                scope.ready = true;
              }
            }, true);

            scope.zoomToUser = function(user) {
              $rootScope.$broadcast('zoomToUserTrack', user);
              scope.status.isopen = false;
            };

            scope.toggleUserLocation = function(user) {
              $rootScope.$broadcast('toggleUserLocation', user);
            };

            scope.toggleUserTrack = function(user) {
              $rootScope.$broadcast('toggleUserTrack', user);
            };
          }
        };
      });
}());


