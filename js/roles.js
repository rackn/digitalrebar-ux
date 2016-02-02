/*
role controller
*/
(function(){
    angular.module('app').controller('RolesCtrl', function($scope, debounce, $routeParams, $mdMedia, $mdDialog, api) {
        
        $scope.$emit('title', 'Roles'); // shows up on the top toolbar

        var roles = this;

        $scope.myOrder = 'jig_name'
        $scope.flags = ["library", "implicit", "bootstrap", 
            "discovery", "cluster", "destructive", "abstract"];
        
        // converts the _node_roles object that rootScope has into an array
        $scope.getRoles = function() {
          var roles = []
          for(var id in $scope._roles) {
                roles.push($scope._roles[id])
          }
          return roles;
        }

        $scope.id = $routeParams.id
        $scope.role = {}

        if(Object.keys($scope._roles).length) {
            $scope.role = $scope._roles[$scope.id];
        } else {
            $scope.$on('rolesDone', function(){
                $scope.role = $scope._roles[$scope.id];
            })
        }

    });

})();