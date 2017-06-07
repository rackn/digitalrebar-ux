/*
  Copyright 2017, RackN
  Rules Engine Controller
*/
(function () {
  angular.module('app').controller('EngineCtrl', [
    '$scope',
    function ($scope) {
      $scope.$emit('title', 'Rule Engine'); // shows up on the top toolbar
    }
  ]);
})();
