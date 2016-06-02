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
                   			}).success(function(){
                                api.remove('node', node.id)
                            })
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
                        }).success(function(){
                            api.remove('node', $scope.node.id)
                            $location.path("/nodes")
                        })

                }
            })
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
                    number: 1,
                    _deployments: $scope._deployments
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

        // creates an array of unused roles for a specified deployment
        $scope.getRoles = function() {
            var roles = []
            var active = []
            var deployment_id = $scope.node.deployment_id
            for(var id in $scope._node_roles) {
                var node_role = $scope._node_roles[id]
                if(node_role.deployment_id == deployment_id) {
                    active.push(node_role.role_id)
                }
    
            }
            for(var id in $scope._deployment_roles){
                var deployment_role = $scope._deployment_roles[id]
                if(active.indexOf(deployment_role.role_id) == -1) {
                    roles.push(deployment_role)
                }
            }
            return roles;
        }

        // binds a node role to the deployment, role, and node
        $scope.bindNodeRole = function(role_id) {
            var node_id = $scope.node.id
            var deployment_id = $scope.deployment_id
            api("/api/v2/node_roles/", {
                method: "POST",
                data: {
                    node_id: node_id,
                    deployment_id: deployment_id,
                    role_id: role_id
                }
            }).success(api.addNodeRole).
            error(function(err){
                api.toast("Error Adding Node Role - "+err.message)
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