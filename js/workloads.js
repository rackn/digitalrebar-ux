/*
workloads controller
*/
(function () {
  angular.module('app')
    .controller('WorkloadsCtrl', function ($scope, api, $location, $routeParams) {
      $scope.$emit('title', 'Wizard'); // shows up on the top toolbar

      var workloads = this;

      var id = $routeParams.id;

      // only accept barclamps that are ... barclamps and wizard capable
      if (typeof $scope._barclamps[id] === 'undefined' ||
        typeof $scope._barclamps[id].cfg_data.wizard === 'undefined') {
        $scope.setPath('/deployments')
        return;
      }

      $scope.barclamp = $scope._barclamps[id];
      $scope.wizard = barclamp.cfg_data.wizard;
      $scope.$emit('title', wizard.name+' Wizard'); 

      $scope.getNodes = function () {
        var nodes = [];
        for (var i in $scope._nodes) {
          var node = $scope._nodes[i];
          // TODO add logic based on wizard config
          nodes.push(node);
        }
        return nodes;
      };

    });
})();
