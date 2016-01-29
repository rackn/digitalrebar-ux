/*
node role controller
*/
(function(){
    angular.module('app').controller('NodeRolesCtrl', function($scope, debounce, $routeParams, $mdMedia, $mdDialog, api) {
        
        $scope.$emit('title', 'NodeRoles'); // shows up on the top toolbar

        var node_roles = this;

        $scope.myOrder = 'id'
        
        // converts the _node_roles object that rootScope has into an array
        $scope.getNodeRoles = function() {
          var roles = []
          for(var id in $scope._node_roles) {
                roles.push($scope._node_roles[id])
          }
          return roles;
        }

        $scope.id = $routeParams.id
        $scope.node_role = {}

        if(Object.keys($scope._node_roles).length) {
            $scope.node_role = $scope._node_roles[$scope.id];
        } else {
            $scope.$on('nodeRolesDone', function(){
                $scope.node_role = $scope._node_roles[$scope.id];
            })
        }

    });

})();