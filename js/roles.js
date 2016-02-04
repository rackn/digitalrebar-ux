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
        
        // converts the _roles object that rootScope has into an array
        $scope.getRoles = function() {
          var roles = []
          for(var id in $scope._roles) {
                roles.push($scope._roles[id])
          }
          return roles;
        }

        $scope.id = $routeParams.id
        $scope.role = {}
        $scope.editing = false;

        var updateRole =  function(){
            if($scope.editing) return;

            $scope.role = $scope._roles[$scope.id];
            if(!$scope.role)
                $location.path('/roles')
            else
                $scope.$on('role'+$scope.role.id+"Done", updateRole)
        }

        if(Object.keys($scope._roles).length) {
            updateNodeRole()
        } else {
            $scope.$on('rolesDone',updateRole)
        }

    });

})();