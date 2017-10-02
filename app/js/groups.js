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

      if ($routeParams.id)
        $scope.expand[$routeParams.id] = true;

      let GroupsCtrl = this;
      this.groups = [];

      // converts the _nodes object that rootScope has into an array
      this.getGroups = function () {
        let groups = [];
        for (let id in $scope._groups) {
          let group = angular.copy($scope._groups[id]);
          groups.push(group);
        }
        GroupsCtrl.groups = groups;
      };
      
    }
  ]);
})();
