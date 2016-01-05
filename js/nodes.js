/*
node controller
*/
(function(){
    angular.module('app').controller('NodeCtrl', function($scope, $rootScope, $timeout) {
        $rootScope.title = 'Nodes'; // shows up on the top toolbar

        var nodes = this;
        this.selected = []
        this.order = 'name'
        this.limit = 50
        this.page = 1

        $rootScope.getDeployments()
        $rootScope.getProviders()

        this.getNodes = function() {
        	var nodes = []
        	for(var id in $rootScope._nodes) {
        		nodes.push($rootScope._nodes[id])
        	}
        	return nodes
        }

        this.deleteSelected = function() {
        	for(var i in nodes.selected) {
        		var node = nodes.selected[i]
        		console.log("Deleting node "+node.id)
        		$rootScope.callApi('/api/v2/nodes/'+node.id, {method: 'DELETE'}).
        			success(function(){console.log("Deleted node")})
        		$timeout(function(){$rootScope.getDeployments()}, 500)
        	}
        }

    });

})();