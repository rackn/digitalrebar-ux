/*
Copyright 2015, RackN
annealer controller
*/
(function(){
    angular.module('app').controller('AnnealerCtrl', function($scope) {
        $scope.$emit('title', 'Annealer'); // shows up on the top toolbar

        $scope.getNodeRoles = function() {
        	var roles = []
        	for(var id in $scope._node_roles) {
        		roles.push($scope._node_roles[id])
        	}
        	return roles
        }

    });

})();