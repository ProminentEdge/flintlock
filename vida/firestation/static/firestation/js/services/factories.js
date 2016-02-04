'use strict';

(function() {
    angular.module('fireStation.factories', ['ngResource'])

    .factory('Tracks', function ($resource) {
        return $resource('/api/v1/track/:id/', {},
            {query: { method: 'GET', isArray: false},
             update: {method: 'PUT'}
            });
    })

    .factory('LatestTracks', function ($resource) {
        return $resource('/api/v1/latest-tracks/:id/', {},
            {query: { method: 'GET', isArray: false},
             update: {method: 'PUT'}
            });
    })

    .factory('Report', function ($resource) {
        return $resource('/api/v1/report/:id/', {},
            {query: { method: 'GET', isArray: true,
                transformResponse: function (jsondata) {
                    return JSON.parse(jsondata).objects;
                }
            },
                update: {method: 'PUT'}
            });
    })
})();