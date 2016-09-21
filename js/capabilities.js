/*
capabilities controller
*/
(function () {
  angular.module('app')
    .controller('CapabilitiesCtrl', function ($scope, api, $mdMedia, $mdDialog, $routeParams) {
      $scope.$emit('title', 'Capabilities'); // shows up on the top toolbar

    })
    .filter('groupsonly', function(){
      return function(cap) {
        filter = []
        for (var i in cap) {
          name = cap[i].name;
          if (cap[i].includes.length > 0 && name.substr(name.length - 4) != "_ALL")
            filter.push(cap[i]);
        }
        return filter;
      }
    });
})();
