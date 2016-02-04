'use strict';

(function() {
    angular.module('fireStation.departmentDetailController', [])

    .controller('jurisdictionController', function($scope, $http, LatestTracks, Report, map, $interval) {
          var departmentMap = map.initMap('map', {scrollWheelZoom: false});
          var config = {centroid:  L.latLng(38.90, -77.0164)};
          var showTracks = true;
          var timeFormat = 'MMMM Do YYYY, hh:mm:ss';
          var stationIcon = L.VIDAMarkers.firestationmarker();
          var headquartersIcon = L.VIDAMarkers.headquartersmarker();
          var fitBoundsOptions = {};
          var layersControl = L.control.layers().addTo(departmentMap);
          var tracksLayer, stop;

          $scope.tracks = [];
          $scope.lastUpdated = moment().format(timeFormat);

          function setUpdateTime() {
                $scope.lastUpdated = moment().format(timeFormat);
            }

          function updateTracks() {
            LatestTracks.query().$promise.then(function(data) {
                 $scope.tracks = data.objects;

                  var tracksMarkers = [];
                  var numTracks = $scope.tracks.length;
                  for (var i = 0; i < numTracks; i++) {
                      var track = $scope.tracks[i];
                      var markerRadius = 3;
                      var markerConfig = {};
                      var popupText = '<b>User: </b>' + track.user + '<br/> <b>Time:</b> ' + moment(track.timestamp).format(timeFormat);

                      if (track.mayday === true) {
                        markerConfig.color = '#FF851B';
                        markerConfig.opacity = '1';
                        markerConfig.fillOpacity = '.5';
                        markerRadius = 4;
                        popupText = '<b>Mayday!</b><br/>' + popupText;
                      }

                      var marker = L.circleMarker(track.geom.coordinates.reverse(), markerConfig);
                      marker.setRadius(markerRadius);

                      marker.bindPopup(popupText);
                      tracksMarkers.push(marker);
                  }

				 if (numTracks > 0) {
                    if (angular.isDefined(tracksLayer) === true) {
                        departmentMap.removeLayer(tracksLayer);
                        layersControl.removeLayer(tracksLayer);
                    }
                    tracksLayer = L.featureGroup(tracksMarkers);
                    tracksLayer.addTo(departmentMap);
                    layersControl.addOverlay(tracksLayer, 'GPS Tracks');

					if (config.geom === null) {
						departmentMap.fitBounds(tracksLayer.getBounds(), fitBoundsOptions);
					}
			     }
                 setUpdateTime();
              });
          };

          departmentMap.setView(config.centroid, 13);

          var stopPolling = function() {
              if (angular.isDefined(stop)) {
                $interval.cancel(stop);
                stop = undefined;
              }
          };

          var startPolling = function() {
              stop = $interval(function() {
                updateTracks()
              }, 5000);
          };

          updateTracks();
          startPolling();

           $scope.zoomToTracksLayer = function () {
               departmentMap.fitBounds(tracksLayer.getBounds(), fitBoundsOptions);
           };

          /*
          if (config.centroid != null) {
           var headquarters = L.marker(config.centroid, {icon: headquartersIcon,zIndexOffset:1000});
           headquarters.addTo(departmentMap);
           layersControl.addOverlay(headquarters, 'Headquarters Location');
          };

          if (config.geom != null) {
           var countyBoundary = L.geoJson(config.geom, {
                                  style: function (feature) {
                                      return {color: '#0074D9', fillOpacity: .05, opacity:.8, weight:2};
                                  }
                              }).addTo(departmentMap);
            layersControl.addOverlay(countyBoundary, 'Jurisdiction Boundary');
            departmentMap.fitBounds(countyBoundary.getBounds(), fitBoundsOptions);
          } else {
              departmentMap.setView(config.centroid, 13);
          }
          */
          $scope.toggleFullScreenMap = function() {
              departmentMap.toggleFullscreen();
          };

      })

      .controller('personController', function($scope, $rootScope, $http, shelterServ) {
        $scope.shelterList = [];
        $scope.current_shelter = {};

        $scope.getShelterByUUID = function(id) {
          var shelter = shelterServ.getShelterByUUID(id);
          if (shelter) {
            document.getElementById("shelterID").innerHTML = '<div class="ct-u-displayTableCell">' +
              '<span class="ct-fw-600">Current Shelter</span></div>' +
              '<div class="ct-u-displayTableCell text-right">' +
              '<span>' + shelter.name + '   </span>' +
              '<a style="display: inline-block;"' +
              'class="fa fa-chevron-right trigger" href="/shelters/' + shelter.id + '\/" ></a></div> </div>';
            return shelter;
          } else
            return undefined;
        };

        $scope.getAllShelters = function() {
          shelterServ.getAllShelters(function() {});
        };

        $scope.getAllShelters();
      })
})();
