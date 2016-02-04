/*
node role controller
*/
(function(){
    angular.module('app').controller('NodeRolesCtrl', function($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, api) {
        
        $scope.$emit('title', 'Node Roles'); // shows up on the top toolbar

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

        $scope.retry = function() {
            // if we have a valid node selected
            if($scope.node_role.id) {
                api('/api/v2/node_roles/'+node_role.id+'/retry', {
                    method: 'PUT'
                }).success(api.addNodeRole);
            }
        }

        $scope.id = $routeParams.id
        $scope.node_role = {}
        $scope.editing = false;

        var updateNodeRole =  function(){
            if($scope.editing) return;

            $scope.node_role = $scope._node_roles[$scope.id];
            if(!$scope.node_role)
                $location.path('/node_roles')
            else
                $scope.$on('node_role'+$scope.node_role.id+"Done", updateNodeRole)
        }

        if(Object.keys($scope._node_roles).length) {
            updateNodeRole()
        } else {
            $scope.$on('node_rolesDone',updateNodeRole)
        }

    });

})();