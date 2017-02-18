/*
welcome controller
*/
(function () {
  angular.module('app')
    .controller('WelcomeCtrl', function ($scope, api, $location, localStorageService, $http, $cookies, debounce, $mdMedia, $mdDialog, $mdToast) {
      $scope.$emit('title', 'Welcome to RackN Digital Rebar!'); // shows up on the top toolbar


    });
})();
