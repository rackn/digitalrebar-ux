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

        this.deleteSelected = function(event) {
            $scope.confirm(event, {
                title: "Delete Nodes",
                message: "Are you sure you want to delete selected nodes?",
                yesCallback: function(){
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
            })
        }

        this.deleteNode = function(event) {
            $scope.confirm(event, {
                title: "Delete Node",
                message: "Are you sure you want to delete "+$scope.node.name,
                yesCallback: function(){
                    
                    if($scope.node.admin) {
                        console.log("Can't delete admin node!")
                        api.toast("Cannot delete admin node")
                        return;
                    }

                    console.log("Deleting node "+$scope.node.id)

                    // the api call uses REST DELETE on /nodes/id to remove a node 
                    api('/api/v2/nodes/'+$scope.node.id, {method: 'DELETE'}).
                        success(function(){
                            console.log("Node deleted")
                        }).success(api.addNode).success(function(){
                            $location.path("/nodes")
                        })

                }
            }
        )
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

        $scope.assignNodes = function(arr, deployment_id) {
            arr.forEach(function(node) {
                api("/api/v2/nodes/"+node.id, {
                    method: "PUT",
                    data: {
                        node_deployment: {
                            deployment_id: deployment_id,
                            old_deployment: node.deployment_id
                        }
                    }
                }).success(api.addNode)
            })
        }

        $scope.id = $routeParams.id
        $scope.node = {}
        $scope.hasAttrib = -1;
        $scope.attribs = [];
        $scope.editing = false;
        var hasCallback = false;

        var updateNode = function() {
            if($scope.editing) return;

            $scope.node = $scope._nodes[$scope.id];

            if(!$scope.node)
                $location.path('/nodes')
            else {

                if($scope.hasAttrib == -1) {
                    api('/api/v2/nodes/'+$scope.node.id+"/attribs").
                    success(function(obj) {
                        $scope.attribs = obj;
                        obj.forEach(function(attrib){
                            attrib.len = JSON.stringify(attrib.value).length
                            attrib.value = JSON.stringify(attrib.value, null, '  ').trim()
                        })
                        $scope.hasAttrib = 1;
                    }).
                    error(function() {
                        $scope.hasAttrib = 0;
                    })
                }

                if(!hasCallback) {
                    hasCallback = true;
                    $scope.$on('node'+$scope.node.id+"Done", updateNode)
                }
            }

        }
        if(Object.keys($scope._nodes).length) {
            updateNode()
        } else {
            $scope.$on('nodesDone', function(){
                if(typeof $scope._nodes[$scope.id] === 'undefined')
                    $location.path('/nodes')
                else
                    updateNode()
            })
        }

    });

})();