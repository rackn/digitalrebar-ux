/*
  Copyright 2017, RackN
  Welcome Controller
*/
(function () {
  angular.module('app')
  .controller('WelcomeCtrl', [
    '$scope',
    function ($scope) {
      $scope.$emit('title', 'Welcome to RackN Digital Rebar!'); // shows up on the top toolbar
    }
  ]);
})();
