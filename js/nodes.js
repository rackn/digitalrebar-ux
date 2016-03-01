/*
node controller
*/
(function(){
    angular.module('app').controller('NodesCtrl', function($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, api) {
        
        $scope.$emit('title', 'Nodes'); // shows up on the top toolbar

        var nodes = this;
        this.selected = []

        // converts the _nodes object that rootScope has into an array
        this.getNodes = function() {
        	var nodes = []
        	for(var id in $scope._nodes) {
                if(!$scope._nodes[id].system)
            		nodes.push($scope._nodes[id])
        	}
        	return nodes
        }

        this.deleteSelected = function() {
        	nodes.selected.forEach(function(node) {

        		if(node.admin) {
        			console.log("Can't delete admin node !"+node.id)
                    return;
        		}

        		console.log("Deleting node "+node.id)

        		// the api call uses REST DELETE on /nodes/id to remove a node 
        		api('/api/v2/nodes/'+node.id, {method: 'DELETE'}).
        			success(function(){
        				console.log("Node deleted")
           			}).success(api.addNode)
        	})

        	// remove the selected items
        	nodes.selected = []
        }

        this.showAddNodeDialog = function(ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            $mdDialog.show({
                controller: 'DialogController',
                controllerAs: 'dialog',
                templateUrl: 'views/dialogs/addnodedialog.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    base_name: 'digital-rebar-node',
                    providers: $scope._providers,
                    add_os: 'default_os',
                    number: 1
                },
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
        };

        $scope.id = $routeParams.id
        $scope.node = {}
        $scope.editing = false;
        var hasCallback = false;

        var updateNode = function() {
            if($scope.editing) return;

            $scope.node = $scope._nodes[$scope.id];
            if(!$scope.node)
                $location.path('/nodes')
            else if(!hasCallback) {
                hasCallback = true;
                $scope.$on('node'+$scope.node.id+"Done", updateNode)
            }

        }
        if(Object.keys($scope._nodes).length) {
            updateNode()
        } else {
            $scope.$on('nodesDone', function(){
                $scope.node = $scope._nodes[$scope.id];
                if(!$scope.node)
                    $location.path('/nodes')
            })
        }

    });

})();