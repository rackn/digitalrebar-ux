/*
  Copyright 2017, RackN
  Node Controller
*/
(function () {
  angular.module('app').controller('GroupsCtrl', [
    '$scope', '$location', 'debounce', '$routeParams', '$mdMedia', '$mdDialog',
    'api',
    
    function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog,
      api) {

      $scope.$emit('title', 'Groups'); // shows up on the top toolbar

      $scope.expand = {};

      $scope.myOrder = 'name';
      $scope.nodes = {};
      $scope.cols = ['error', 'active', 'ready', 'off'];

      $scope.group_count = Object.keys($scope._groups).length;
      $scope.valueOrder = 'name';

      let deregister = $scope.$watchCollection('_groups', function(groups){
        $scope.group_count = Object.keys(groups).length;
        $scope.groups = {};
        Object.keys(groups).forEach(function(id) {
          let group = groups[id];
          $scope.groups[id] = Object.keys(groups.values).map(function(key) {
            return {key: key, value: groups[key]};
          });
        });
      });

      $scope.$on('$destroy', deregister);

      $scope.getNodes = function (group) {
        $scope.nodes[group] = { 'error': [], 'active': [], 'ready': [], 'off': []  }
        api('/api/v2/groups/'+group+'/nodes').then(function (resp) {
          resp.forEach((n) => {
            console.log('ZEHICLE', n);
            $scope.nodes[group]['error'][n.id] = { 'name': n.name, 'status': n.status };
          });
        });
      };
    }
  ]);
})();
