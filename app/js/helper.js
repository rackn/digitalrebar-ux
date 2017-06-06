/*
api helper controller
*/
(function () {
  angular.module('app')
    .controller('ApiHelperCtrl', function ($scope, api, localStorageService) {
      $scope.$emit('title', 'API Helper'); // shows up on the top toolbar

      $scope.method = localStorageService.get('api_helper_method') || 'get';
      $scope.payload = localStorageService.get('api_helper_payload') || '{}';
      $scope.route = localStorageService.get('api_helper_route') || '';
      $scope.class = {};

      $scope.parse = function (data) {
        try {
          var a = JSON.parse(data);
          localStorageService.add('api_helper_payload', data);
          localStorageService.add('api_helper_method', $scope.method);
          localStorageService.add('api_helper_route', $scope.route);
          return a;
        } catch (e) {
          return false;
        }
      };

      var deregister = $scope.$watchCollection('method', function (method) {
        if(method === 'patch' && $scope.payload == '{}')
          $scope.payload = '[\n  { "op": "replace/add/remove", "path": "/attrName", "value": "foo" }\n]'
      });

      $scope.$on('$destroy', deregister);

      $scope.testApi = function () {
        api($scope.route, {method: $scope.method, data: JSON.parse($scope.payload)}).
        then(function (resp) {
          $scope.class = {success: true};
          $scope.output = JSON.stringify(resp.data, null, "  ");
        }, function (err) {
          $scope.class = {error: true};
          $scope.output = JSON.stringify(err && err.data || err, null, "  ") || err.data;
        });
      };

      $scope.clearOutput = function () {
        $scope.output = "";
        $scope.class = {};
      }
    });
})();
