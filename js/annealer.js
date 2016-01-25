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

        $scope.getNodeRoles = function(status) {
        	var roles = []
        	for(var id in $scope._node_roles) {
                var role = $scope._node_roles[id];
                if(status == role.status)
            		roles.push(role)
        	}
        	return roles
        }

        $scope.statesList = ['error','process', 'todo', 'queue'];

    });

})();