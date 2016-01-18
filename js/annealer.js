/*
Copyright 2015, RackN
annealer controller
*/
(function(){
    angular.module('app').controller('AnnealerCtrl', function($scope) {
        $scope.$emit('title', 'Annealer'); // shows up on the top toolbar

        $scope.selected = -1;

        $scope.setNode = function(id) {
            $scope.$emit('title', 'Annealer '+(id != -1 ? '('+$scope._nodes[id].name+')' : ''));
            $scope.selected = id;
        }

        $scope.getNodeRoles = function() {
        	var roles = []
        	for(var id in $scope._node_roles) {
        		roles.push($scope._node_roles[id])
        	}
        	return roles
        }

    });

})();