'use strict';

(function() {
    angular.module('fireStation.factories', ['ngResource'])

    .factory('Tracks', function ($resource) {
        return $resource('/api/v1/track?limit=', {},
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

    .factory('CurrentUser', function ($resource) {
        return $resource('/api/v1/current-user/', {},
            {query: { method: 'GET', isArray: false}
            });
    })

    .factory('Report', function ($resource) {
        return $resource('/api/v1/report/:id/', {},
            {query: { method: 'GET', isArray: false},
             update: {method: 'PUT'}
            });
    })

    .factory('Form', function ($resource) {
        return $resource('/api/v1/form/:id/', {},
            {query: { method: 'GET', isArray: false},
             update: {method: 'PUT'}
            });
    })
     .factory('FeaturesReport', function ($resource) {
      return $resource('/api/v1/report/?&latitude=:latitude&longitude=:longitude&D=:distance&limit=10', {},
            {get: { method: 'GET'}
            });
    })
     .factory('FeaturesTrack', function ($resource) {
      return $resource('/api/v1/track/?&latitude=:latitude&longitude=:longitude&D=:distance&limit=10', {},
            {get: { method: 'GET'}
            });
    })
})();