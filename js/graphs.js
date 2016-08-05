/*
graphs controller
*/
(function () {
  angular.module('app').controller('GraphsCtrl', function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, $timeout, api) {

    $scope.$emit('title', 'Graphs'); // shows up on the top toolbar

    $scope.graphData = {};
    $scope.graphOptions = {};

    $scope.graphType = "node_roles";
    $scope.graphDeployment = null;
    $scope.graphNode = null;
    $scope.graphRole = null;
    $scope.graphBarclamp = null;
    $scope.graphHLayout = false;

    $scope.getGraph = function() { 
      $scope.hasGraph = -1;
      api("/api/v2/"+$scope.graphType+"/graph").
        success(function (obj) {
          var parsedData = vis.network.convertDot(obj["string"]);
          $scope.graphData = {
            nodes: parsedData.nodes,
            edges: parsedData.edges
          }
          $scope.graphOptions = parsedData.options;
	  if ($scope.graphHLayout) {
            $scope.graphOptions["layout"] = {
                hierarchical: {
                  enabled:true,
                  levelSeparation: 150,
                  direction: 'UD',        // UD, DU, LR, RL
                  sortMethod: 'directed'   // hubsize, directed
                }
              };
          }
          $scope.hasGraph = 1;
        }).
        error(function (err) {
          $scope.hasGraph = 0;
          api.toast("Error Getting Graph Data", 'node_role', err);
        });
    }

    $scope.getGraph();
  });
})();
