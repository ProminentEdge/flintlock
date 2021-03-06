'use strict';

(function() {
  var module = angular.module('fireStation.trackPopup', []);

  module.directive('trackPopup',
      function($http, $filter, map) {
        return {
          restrict: 'E',
          replace: true,
          templateUrl: '/static/firestation/js/directives/track-popup/track-popup.tpl.html',
          link: function(scope, element, attrs) {
            scope.user = scope.track.user ? scope.track.user.username : 'Not Specified';
            scope.getTimeStamp = function() {
              return  $filter('date')(new Date(scope.track.timestamp),'MM/dd/yyyy, HH:mm');
            };
            scope.requestProcessing = false;
            var updateTrack = function(username) {
              scope.requestProcessing = true;

              $http.get('/api/v1/track/?limit=100&user__username=' + username).then(function (response) {
                var tracks = response.data.objects;
                // Create line string
                var latlngs = [];
                for (var i = 0; i < tracks.length; i++) {
                  latlngs.push(tracks[i].geom.coordinates.reverse());
                }
                if (scope.trackLayers[scope.user] !== null && angular.isDefined(scope.trackLayers[scope.user])) {
                  map.map.removeLayer(scope.trackLayers[scope.user]);
                  map.layerControl.removeLayer(scope.trackLayers[scope.user]);
                }
                var userTrack = L.polyline(latlngs, {color: scope.track.force_color, opacity: 1});
                scope.trackLayers[scope.user] = L.featureGroup([userTrack]);
                scope.trackLayers[scope.user].addTo(map.map);
                //TODO[YS]: just commented in a case we need to added it back
                //map.layerControl.addOverlay(scope.trackLayers[scope.user], scope.user );
                scope.requestProcessing = false;
              });
            };
            scope.toggleTrack = function() {
              if (scope.trackLayers[scope.user] !== null && angular.isDefined(scope.trackLayers[scope.user])) {
                map.map.removeLayer(scope.trackLayers[scope.user]);
                map.layerControl.removeLayer(scope.trackLayers[scope.user]);
                scope.trackLayers[scope.user] = null;
                scope.$emit('isShowAllTracks');

              } else if (!scope.requestProcessing) {
                updateTrack(scope.track.user.username);
              }
            };
            scope.$on('track-showAllTracks', function() {
                updateTrack(scope.track.user.username);
            });

            scope.$on('tracks-updated', function() {
              if (scope.trackLayers[scope.user] !== null && angular.isDefined(scope.trackLayers[scope.user])) {
                updateTrack(scope.track.user.username);
              }
            });

            scope.$on('toggleUserTrack', function(event, user) {
              if (user === scope.user) {
                scope.toggleTrack();
              }
            });

             scope.$on('viewTrackFromFeature', function(event, args) {
                if (args.track.user.username === scope.user) {
                  scope.toggleTrack();
                }
            });
          }
        };
      });
}());


