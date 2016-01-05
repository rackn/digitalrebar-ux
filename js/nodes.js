/*
node controller
*/
(function(){
    angular.module('app').controller('NodeCtrl', function($scope, $rootScope, $timeout) {
        $rootScope.title = 'Nodes'; // shows up on the top toolbar

        var nodes = this;
        this.selected = []
        this.order = 'name'

        // get the data that is displayed
        $rootScope.getDeployments()
        $rootScope.getProviders()

        // converts the _nodes object that rootScope has into an array
        this.getNodes = function() {
        	var nodes = []
        	for(var id in $rootScope._nodes) {
        		nodes.push($rootScope._nodes[id])
        	}
        	return nodes
        }

        this.deleteSelected = function() {
        	var promise;
        	for(var i in nodes.selected) {
        		var node = nodes.selected[i]

        		if(node.admin) {
        			console.log("Can't delete admin node !"+node.id)
        			continue;
        		}
        		
        		console.log("Deleting node "+node.id)

        		// the api call uses REST DELETE on /nodes/id to remove a node 
        		$rootScope.callApi('/api/v2/nodes/'+node.id, {method: 'DELETE'}).
        			success(function(){
        				console.log("Node deleted")
        				
        				// if we're already waiting to get the deployments,
        				// cancel that call and wait some more
        				// getDeployments ends up being called once when
        				// the last node is successfully deleted
        				if(promise)
        					$timeout.cancel(promise)
        				
        				promise = $timeout(function(){
        					$rootScope.getDeployments()
        				}, 500)
        			})
        	}

        	// remove the selected items
        	nodes.selected = []
        }

    });

})();