'use strict';

(function () {
    var module = angular.module('fireStation.dateTimePicker', []);

    module.directive('dateTimePicker', ['$filter',
        function ($filter) {
            return {
                scope: {
                    dateTimeModel: "=",
                    isValidDateTime: "="
                },
                restrict: 'E',
                replace: true,
                templateUrl: '/static/firestation/js/directives/dateTimePicker/date-time-picker.tpl.html',
                link: function (scope) {
                    scope.dateTime = $filter('date')(new Date(scope.dateTimeModel), 'MM/dd/yyyy HH:mm');
                    scope.validateDateTime = function () {
                        var date_regex = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}\s([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        if (scope.dateTime) {
                            scope.isValidDateTime = date_regex.test(scope.dateTime);
                            scope.dateTimeModel = scope.isValidDateTime ? new Date(scope.dateTime) : null;
                        } else {
                            scope.isValidDateTime = true;
                            scope.dateTimeModel = null;
                        }
                    }

                }
            };
        }]);
}());


