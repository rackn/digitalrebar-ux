/*
graphs controller
*/
(function () {
  angular.module('app').controller('GraphsCtrl', function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, $timeout, api) {

    $scope.$emit('title', 'Graphs'); // shows up on the top toolbar

    $scope.graphData = {};
    $scope.graphOptions = {};

    $scope.graphType = "node_roles";
    $scope.graphDeployment = 0;
    $scope.graphNode = 0;
    $scope.graphRole = 0;
    $scope.graphBarclamp = 0;
    $scope.graphHLayout = false;

    $scope.graphLayoutOptions = {
      hierarchical: {
        enabled:true,
        levelSeparation: 150,
        direction: 'UD',        // UD, DU, LR, RL
        sortMethod: 'directed'   // hubsize, directed
      }
    };

    $scope.getGraph = function() { 
      $scope.hasGraph = -1;
      var payload = {};
      switch($scope.graphType) {
      case "node_roles":
        if ($scope.graphDeployment)
          payload.deployment_id = $scope.graphDeployment;
        if ($scope.graphRole)
          payload.role_id = $scope.graphRole;
        if ($scope.graphNode)
          payload.node_id = $scope.graphNode;
        break;
      case "roles":
        if ($scope.graphRole)
          payload.role_id = $scope.graphRole;
        if ($scope.graphBarclamp)
          payload.barclamp_id = $scope.graphBarclamp;
        break;
      }
      if ($scope.graphDeployment)
      api("/api/v2/"+$scope.graphType+"/graph", {
        data: payload,
      }).
        then(function (resp) {
          var obj = resp.data
          var parsedData = vis.network.convertDot(obj["string"]);
          $scope.graphData = {
            nodes: parsedData.nodes,
            edges: parsedData.edges
          }
          $scope.graphOptions = parsedData.options;
          if ($scope.graphHLayout) {
            $scope.graphOptions["layout"] = $scope.graphLayoutOptions;
          }
          $scope.hasGraph = 1;
        }, function (err) {
          $scope.hasGraph = 0;
          api.toast("Error Getting Graph Data", 'node_role', err.data);
        });
    }

    $scope.$watchCollection('graphHLayout', function (val) {
      if(val) {
        $scope.graphOptions["layout"] = $scope.graphLayoutOptions;
      } else {
        $scope.graphOptions["layout"] = {
          hierarchical: {
            enabled: false,
          }
        };
      }
    })

    $scope.getGraph();
  });
})();
