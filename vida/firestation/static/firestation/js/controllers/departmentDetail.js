'use strict';

(function () {
    angular.module('fireStation.departmentDetailController', [])

        .controller('jurisdictionController', function ($scope, $http, $compile, $filter, $q, CurrentUser,
                                                        LatestTracks, Report, map, $interval, reportService,
                                                        formService, Form, FeaturesReport, FeaturesTrack, filterService) {
            var timeFormat = 'MMMM Do YYYY, hh:mm:ss';
            var fitBoundsOptions = {};
            var queryDict = {};
            var tracksLayer, stop, departmentMap;
            var trackLayers = {};
            var popups = {};
            $scope.tracks = [];
            $scope.lastUpdated = $filter('date')(new Date(), 'MM/dd/yyyy, HH:mm:ss');
            $scope.isDisplayedTracks = true;
            $scope.filterAllReports = false;
            $scope.lastUpdated = moment().format(timeFormat);
            $scope.usernames = [];
            departmentMap = map.initMap('map', {scrollWheelZoom: false});
            L.control.scale().addTo(departmentMap);

            departmentMap.on('click', function (e) {
                var filteredReport = filterService.getFilters();
                $scope.reportItems = [];
                var mapZoom = departmentMap.getZoom();
                var scale = [4000, 800, 500, 300, 50, 150, 20, 10, 5, 3, 1, 0.8, 0.6, 0.3, 0.1, 0.05, 0.03, 0.02, 0.01];
                var p1 = FeaturesReport.get({
                    latitude: e.latlng.lat,
                    longitude: e.latlng.lng,
                    D: scale[mapZoom] * 1000
                });
                var p2 = FeaturesTrack.get({latitude: e.latlng.lat, longitude: e.latlng.lng, D: scale[mapZoom] * 1000});
                var p3 = LatestTracks.query();
                $q.all([p1.$promise, p2.$promise, p3.$promise]).then(function (data) {
                    $scope.featureItems = data;

                    if (filterService.isValue()) {
                        angular.forEach($scope.featureItems[0].objects, function (reportItem, index) {
                            angular.forEach(filteredReport, function (filterItem) {
                                if (reportItem.id === filterItem.id) {
                                    $scope.reportItems.push(reportItem);
                                }
                            });
                        });
                        $scope.featureItems[0].objects = $scope.reportItems;
                    }
                    if ($scope.featureItems[0].objects.length === 1 && $scope.featureItems[1].objects.length ===0) {
                        $scope.$emit('viewReportFromFeature', {report: $scope.featureItems[0].objects[0]});
                    } else if ($scope.featureItems[0].objects.length || $scope.featureItems[1].objects.length) {
                        L.popup({minWidth: 120, maxHeight: 100, autoPanPadding: new L.Point(5, 5)})
                            .setLatLng(e.latlng)
                            .setContent($compile('<features-popup></features-popup>')($scope)[0])
                            .openOn(departmentMap);
                    }
                });

            });


            location.search.substr(1).split("&").forEach(function (item) {
                queryDict[item.split("=")[0]] = item.split("=")[1]
            });

            $scope.toggleMapVisibility = function () {
                map.toggleMapVisibility();
            };

            $scope.refreshReports = function () {
                reportService.getReports();
            };

            $scope.$watch(function () {
                return map.showMap
            }, function (val) {
                if (map.showMap === true) {
                    angular.element('#map-parent').css({display: 'block'});
                    map.map.invalidateSize();
                } else {
                    angular.element('#map-parent').css({display: 'none'})
                }
            });

            $scope.showMap = function () {
                return map.showMap;
            };

            if (queryDict.hasOwnProperty('hideMap') === true && queryDict.hideMap === 'true') {
                map.showMap = false;
            }

            CurrentUser.query().$promise.then(function (data) {
                reportService.setCurrentUser(data);
            }, function (error) {
                console.log('Error retrieving current user: ', error);
            });

            function setUpdateTime() {
                $scope.lastUpdated = $filter('date')(new Date(), 'MM/dd/yyyy, HH:mm:ss');
            }

            function updateTracks() {
                LatestTracks.query().$promise.then(function (data) {
                    $scope.$broadcast('tracks-updated');
                    $scope.tracks = data.objects;
                    var tracksMarkers = [];
                    var numTracks = $scope.tracks.length;
                    $scope.usernames.length = 0;
                    $scope.tracks.forEach(function (track) {
                        $scope.usernames.push(track.user.username);
                        var markerConfig = {
                            fillOpacity: .5,
                            color: track.force_color,
                            clickable: false,
                            opacity: 1,
                            riseOnHover: false
                        };
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
                                compiled: linkFunction(popupScope)[0],
                                locationVisible: true
                            };

                            popups[track.user.username].scope.track = track;
                            popups[track.user.username].scope.trackLayers = trackLayers;
                        }

                        var coordinates = track.geom.coordinates;
                        var marker = L.marker([coordinates[1], coordinates[0]], markerConfig);
                        marker.bindPopup(popups[track.user.username].compiled);
                        popups[track.user.username].marker = marker;
                        if (popups[track.user.username].locationVisible) {
                            tracksMarkers.push(marker);
                        }
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

            $scope.$on('zoomToUserTrack', function (event, user) {
                if (popups[user]) {
                    var coordinates = popups[user].scope.track.geom.coordinates;
                    departmentMap.setView([coordinates[1], coordinates[0]], 15);
                    if (popups[user].locationVisible) {
                        popups[user].marker.openPopup();
                    }
                }
            });

            $scope.$on('toggleUserLocation', function (event, user) {
                if (popups[user]) {
                    popups[user].locationVisible = !popups[user].locationVisible;
                    if (popups[user].locationVisible) {
                        tracksLayer.addLayer(popups[user].marker);
                    } else {
                        tracksLayer.removeLayer(popups[user].marker);
                    }
                }
            });

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
                formService.getForms().then(function (forms) {
                    var form = formService.getFormByURI('/api/v1/form/' + queryDict.newReportType + '/');
                    if (form != null) {
                        reportService.createReport(form, null);
                    }
                });
            }

            $scope.displayAllTracks = function () {
                if ($scope.isDisplayedTracks) {
                    $scope.$broadcast('track-showAllTracks');
                    $scope.isDisplayedTracks = !$scope.isDisplayedTracks;
                } else {
                    $scope.isDisplayedTracks = !$scope.isDisplayedTracks;
                    if ($scope.usernames) {
                        angular.forEach($scope.usernames, function (user) {
                            if (trackLayers[user]) {
                                map.map.removeLayer(trackLayers[user]);
                                trackLayers[user] = null;
                            }
                        });
                    }
                }
            };

            $scope.$on('isShowAllTracks', function () {
                $scope.isDisplayedTracks = true;
            });

            $scope.toggleFilterAllReports = function () {
                $scope.filterAllReports = !$scope.filterAllReports;
                $scope.$broadcast('filterAllReports', $scope.filterAllReports);
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
