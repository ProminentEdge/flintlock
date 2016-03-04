'use strict';

(function () {
    angular.module('fireStation.filterService', [])

        .service('filterService', function () {
            var map = {};
            var isValue = false;

            this.setFilters = function (val) {
                isValue = true;
                map[val.id] = val;
            };
            this.getFilters = function () {
                return map;
            };

            this.resetFilters = function () {
                map = {};
            };

            this.isValue = function () {
                return isValue;
            };
        });

})();
