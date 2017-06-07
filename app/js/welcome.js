/*
  Copyright 2017, RackN
  Welcome Controller
*/
(function () {
  angular.module('app')
  .controller('WelcomeCtrl', [
    '$scope',
    function ($scope) {
      // shows up on the top toolbar
      $scope.$emit('title', 'Welcome to RackN Digital Rebar!');
    }
  ]);
})();
