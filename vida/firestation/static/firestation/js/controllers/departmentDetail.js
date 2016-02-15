'use strict';

(function () {
  angular.module('fireStation.departmentDetailController', [])

      .controller('jurisdictionController', function ($scope, $http, $compile, Tracks, CurrentUser, LatestTracks, Report, map, $interval, reportService, formService, Form) {
        var departmentMap = map.initMap('map', {scrollWheelZoom: false});
        var timeFormat = 'MMMM Do YYYY, hh:mm:ss';
        var fitBoundsOptions = {};
        var queryDict = {};
        var tracksLayer, stop;
        var trackLayers = {};
        var trackAllLayers = {};

        var popups = {};

        $scope.tracks = [];
        $scope.lastUpdated = moment().format(timeFormat);
        $scope.isDisplayedTracks = true;
        $scope.users = [];

        CurrentUser.query().$promise.then(function (data) {
          reportService.setCurrentUser(data);
        }, function (error) {
          console.log('Error retrieving current user: ', error);
        });

        location.search.substr(1).split("&").forEach(function (item) {
          queryDict[item.split("=")[0]] = item.split("=")[1]
        });

        function setUpdateTime() {
          $scope.lastUpdated = moment().format(timeFormat);
        }

        function updateTracks() {
          LatestTracks.query().$promise.then(function (data) {
            $scope.$broadcast('tracks-updated');
            $scope.tracks = data.objects;

            var tracksMarkers = [];
            var numTracks = $scope.tracks.length;
            $scope.tracks.forEach(function(track) {
              var markerConfig = {fillOpacity: .5, color: track.force_color};
              var shouldAnimate = true;
              if (moment.now() - moment(new Date(track.timestamp)) > 1000 * 300 /* 300 seconds */) {
                shouldAnimate = false;
              }

              markerConfig.icon = L.icon.pulse({
                iconSize: track.mayday ? [20, 20] : [10, 10],
                color: track.force_color,
                pulseColor: track.mayday ? '#FF851B' : track.force_color,
                heartbeat: track.mayday ? 0.4 : 1,
                animate: shouldAnimate,
                border: track.mayday ? '3px solid #FF851B' : '0'
              });

              if (popups[track.user.username]) {
                popups[track.user.username].scope.track = track;
              } else {
                var linkFunction = $compile(angular.element('<div><track-popup></track-popup></div>'));
                var popupScope = $scope.$new();
                popups[track.user.username] = {
                  scope: popupScope,
                  compiled: linkFunction(popupScope)[0]
                };

                popups[track.user.username].scope.track = track;
                popups[track.user.username].scope.trackLayers = trackLayers;
              }

              var marker = L.marker(track.geom.coordinates.reverse(), markerConfig);
              marker.bindPopup(popups[track.user.username].compiled);
              tracksMarkers.push(marker);
            });

            if (numTracks > 0) {
              if (angular.isDefined(tracksLayer) === true) {
                departmentMap.removeLayer(tracksLayer);
                map.layerControl.removeLayer(tracksLayer);
              }
              tracksLayer = L.featureGroup(tracksMarkers);
              tracksLayer.addTo(departmentMap);
              map.layerControl.addOverlay(tracksLayer, 'GPS Location');
            }
            setUpdateTime();
          });
        }

        var stopPolling = function () {
          if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
          }
        };

        var startPolling = function () {
          stop = $interval(function () {
            updateTracks()
          }, 30000);
        };

        updateTracks();
        startPolling();

        $scope.zoomToTracksLayer = function () {
          if (tracksLayer) {
            departmentMap.fitBounds(tracksLayer.getBounds(), fitBoundsOptions);
          }
        };

        if (queryDict.hasOwnProperty('showReport') === true) {
          Report.query({id: queryDict.showReport}).$promise.then(function (data) {
            var re = /^\/api\/v1\/form\/(\d+)\/$/;

            Form.query({id: data.form.match(re)[1]}).$promise.then(function (form) {
              formService.processForm(form);
              reportService.updateReport(data, true);
              reportService.viewReport(data, true);
            });
          });
        }

        if (queryDict.hasOwnProperty('newReportType') === true) {
          formService.getForms().then(function(forms) {
            var form = formService.getFormByURI('/api/v1/form/' + queryDict.newReportType + '/');
            if (form != null) {
              reportService.createReport(form, null);
            }
          });
        }

         $scope.displayAllTracks = function() {
             var usersTmp = [];
             var usersGeo = {};
             var userTrack = [];
             if ($scope.isDisplayedTracks) {
                 Tracks.query({limit: 100}).$promise.then(function (data) {
                     $scope.isDisplayedTracks = !$scope.isDisplayedTracks;
                     var tracks = data.objects;
                     // Create line string
                     for (var i = 0; i < tracks.length; i++) {
                         usersTmp.push(tracks[i].user.username);
                     }
                     $scope.users = usersTmp.filter(function (item, i, ar) {
                         return ar.indexOf(item) === i;
                     });
                     angular.forEach($scope.users, function (user) {
                         var geomTmp = [];
                         var colorTmp = '';
                         for (var i = 0; i < tracks.length; i++) {
                             if (user === tracks[i].user.username) {
                                 geomTmp.push(tracks[i].geom.coordinates.reverse());
                                 colorTmp = tracks[0].force_color;
                             }
                         }
                         usersGeo[user] = {
                             'geom': geomTmp,
                             'color': colorTmp
                         };
                         userTrack = L.polyline(usersGeo[user].geom, {color: usersGeo[user].color, opacity: 1});
                         trackAllLayers[user] = L.featureGroup([userTrack]);
                         trackAllLayers[user].addTo(map.map);
                     });
                 },function(){
                     $scope.isDisplayedTracks = true;
                 });
             }else {
                 $scope.isDisplayedTracks = !$scope.isDisplayedTracks;
                 if($scope.users) {
                     angular.forEach($scope.users, function(user) {
                         map.map.removeLayer(trackAllLayers[user]);
                         trackAllLayers[user] = null;
                     });
                 }
             }
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
        $scope.toggleFullScreenMap = function () {
          departmentMap.toggleFullscreen();
        };

      })

      .controller('personController', function ($scope, $rootScope, $http, shelterServ) {
        $scope.shelterList = [];
        $scope.current_shelter = {};

        $scope.getShelterByUUID = function (id) {
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

        $scope.getAllShelters = function () {
          shelterServ.getAllShelters(function () {
          });
        };

        $scope.getAllShelters();
      })
})();
