/*
node role controller
*/
(function(){
    angular.module('app').controller('NodeRolesCtrl', function($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, $timeout, api) {
        
        $scope.$emit('title', 'Node Roles'); // shows up on the top toolbar

        var node_roles = this;

        $scope.myOrder = 'id'
        this.selected = []
        
        // converts the _node_roles object that rootScope has into an array
        $scope.getNodeRoles = function() {
          var roles = []
          for(var id in $scope._node_roles) {
                roles.push($scope._node_roles[id])
          }
          return roles;
        }

        $scope.retry = function() {
            // if we have a valid node selected
            if($scope.node_role.id) {
                api('/api/v2/node_roles/'+$scope.node_role.id+'/retry', {
                    method: 'PUT'
                }).success(api.addNodeRole).error(function(err){
                    api.toast('Error: '+err.message, 'node_role')
                });
            }
        }

        $scope.destroySelected = function() {
            $scope.confirm(event, {
                title: "Destroy Node Roles",
                message: "Are you sure you want to destroy the selected node roles?",
                yesCallback: function() {
                    node_roles.selected.forEach(function(node_role) {
                        if(node_role.id) {
                            api('/api/v2/node_roles/'+node_role.id, {
                                method: 'DELETE'
                            }).success(function(){
                                api.remove('node_role', node_role.id)
                            });                    
                        }
                        
                        node_roles.selected = []
                    })

                }
            })
        }

        $scope.destroy = function() {
            $scope.confirm(event, {
                title: "Destroy Node Role",
                message: "Are you sure you want to destroy this node role?",
                yesCallback: function() {
                    if($scope.node_role.id) {
                        api('/api/v2/node_roles/'+$scope.node_role.id, {
                            method: 'DELETE'
                        }).success(function(){
                            api.remove('node_role', $scope.node_role.id)
                            $location.path('/node_roles')
                        });                    
                    }
                }
            })
        }

        $scope.id = $routeParams.id
        $scope.node_role = {}
        $scope.hasAttrib = -1;
        $scope.attribs = [];
        $scope.editing = false;
        var hasCallback = false;

        var updateNodeRole =  function(){
            if($scope.editing) return;

            $scope.node_role = $scope._node_roles[$scope.id];
            if(!$scope.node_role)
                $location.path('/node_roles')
            else {
                if($scope.hasAttrib == -1) {
                    api('/api/v2/node_roles/'+$scope.node_role.id+"/attribs").
                    success(function(obj) {
                        $scope.attribs = obj;
                        obj.forEach(function(attrib){
                            attrib.len = JSON.stringify(attrib.value).length
                            attrib.preview = JSON.stringify(attrib.value, null, '  ').trim().replace(/[\s\n]/g,'')
                            if(attrib.preview.length > 73)
                                attrib.preview = attrib.preview.substr(0, 67)+"..."
                        })
                        $scope.hasAttrib = 1;
                    }).
                    error(function() {
                        $scope.hasAttrib = 0;
                    })
                }

                if(!hasCallback) {
                    hasCallback = true;
                    $scope.$on('node_role'+$scope.node_role.id+"Done", updateNodeRole)
                }
            }
        }

        if(Object.keys($scope._node_roles).length) {
            updateNodeRole()
        } else {
            $scope.$on('node_rolesDone',updateNodeRole)
        }

        $scope.getApiUpdate = function() {
            if($scope.editing || !$scope.node_role) return;

            api.fetch('node_role', $scope.id).success(function() {
                $scope.updateInterval = $timeout($scope.getApiUpdate, 2000);
            })

        }

        $scope.getApiUpdate();
        
        $scope.$on('$routeChangeStart', function() {
            $timeout.cancel($scope.updateInterval);
        });

    });

})();