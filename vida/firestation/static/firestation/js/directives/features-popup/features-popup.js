'use strict';

(function () {
    var module = angular.module('fireStation.featuresPopup', []);

    module.directive('featuresPopup',
        function () {
            return {
                restrict: 'E',
                scope: {},
                replace: true,
                templateUrl: '/static/firestation/js/directives/features-popup/features-popup.tpl.html',
                controller: 'featuresPopupCtrl'
            };
        }).controller('featuresPopupCtrl', featuresPopupCtrl);

    function featuresPopupCtrl($scope, $rootScope, $filter) {
        $scope.reportItems = [];
        $scope.trackItems = [];
        $scope.gpsItems = [];
        $scope.switchCases = 'list';
        var trackUsername = [];
        $scope.trackUsernames = [];
        $scope.trackDisplayItems = [];
        $scope.isBackButton = true;

        angular.forEach($scope.$parent.featureItems[0].objects, function (item) {
            $scope.isReportList = true;
            $scope.reportItems.push(item);

        });

        angular.forEach($scope.$parent.featureItems[1].objects, function (item) {
            $scope.isTrackList = true;
            if (trackUsername.indexOf(item.user.username) === -1) {
                trackUsername.push(item.user.username);
                $scope.trackItems.push(item);

            }
        });


        angular.forEach($scope.$parent.featureItems[2].objects, function (gpsItem) {
            angular.forEach($scope.$parent.featureItems[1].objects, function (trackItem, index) {
                if (JSON.stringify(gpsItem) === JSON.stringify(trackItem)) {
                    $scope.gpsItems.push(gpsItem);
                    $scope.isGPSList = true;
                    $scope.trackItems.splice(index, index + 1);
                    if ($scope.trackItems.length === 0) {
                        $scope.isTrackList = false;

                    }
                }
            });

        });


        $scope.showReports = function () {
            $scope.switchCases = 'items';
            $scope.isReportItems = true;
            $scope.isTrackItems = false;
            $scope.isGPSItems = false;


        };

        $scope.backButton = function () {
            $scope.switchCases = 'list';
            $scope.isReportItems = false;
            $scope.isTrackItems = false;
            $scope.isGPSItems = false;
            $scope.isBackButton = true;

        };

        $scope.showTracks = function () {
            $scope.switchCases = 'items';
            $scope.isReportItems = false;
            $scope.isTrackItems = true;
            $scope.isGPSItems = false;
            $scope.isBackButton = true;


        };

        $scope.showGPS = function () {
            $scope.switchCases = 'items';
            $scope.isReportItems = false;
            $scope.isTrackItems = false;
            $scope.isGPSItems = true;
            $scope.isBackButton = true;


        };

        var showDialog = function () {
            if ($scope.reportItems.length > 1 || $scope.gpsItems.length > 1 || $scope.trackDisplayItems.length > 1) {

            } else {
                if($scope.reportItems.length === 1 && $scope.gpsItems.length === 1){

                }else {
                    if ($scope.gpsItems.length === 1) {
                        $scope.showGPS();
                        $scope.isBackButton = false;
                    }

                    if ($scope.trackDisplayItems.length === 1) {
                        $scope.showTracks();
                        $scope.isBackButton = false;

                    }
                }
            }
        };

        showDialog();

        $scope.getTimeStamp = function (timestamp) {
            return $filter('date')(new Date(timestamp), 'MM/dd/yyyy');
        };

        $scope.viewReport = function (index) {
            $scope.$emit('viewReportFromFeature', {report: $scope.$parent.featureItems[0].objects[index]});
        };

        $scope.viewTrack = function (index) {
            $rootScope.$broadcast('viewTrackFromFeature', {track: $scope.trackItems[index]});

        };
        $scope.viewGPS = function (index) {
            $rootScope.$broadcast('viewTrackFromFeature', {track: $scope.gpsItems[index]});

        }
    }
}());


