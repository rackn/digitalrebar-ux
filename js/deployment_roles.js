/*
deployment role controller
*/
(function(){
    angular.module('app').controller('DeploymentRolesCtrl', function($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog, $timeout, api) {
        
        $scope.$emit('title', 'Deployment Roles'); // shows up on the top toolbar

        var deployment_roles = this;

        $scope.myOrder = 'id'
        this.selected = []
        
        // converts the _node_roles object that rootScope has into an array
        $scope.getDeploymentRoles = function() {
          var roles = []
          for(var id in $scope._deployment_roles) {
                roles.push($scope._deployment_roles[id])
          }
          return roles;
        }

        $scope.propose = function() {
            // if we have a valid node selected
            if($scope.deployment_role.id) {
                api('/api/v2/deployment_roles/'+$scope.deployment_role.id+'/propose', {
                    method: 'PUT'
                }).success(api.addDeploymentRole).error(function(err){
                    api.toast('Error Proposing Deployment Role - '+err.message, 'deployment_role')
                });
            }
        }

        $scope.commit = function() {
            // if we have a valid node selected
            if($scope.deployment_role.id) {
                api('/api/v2/deployment_roles/'+$scope.deployment_role.id+'/commit', {
                    method: 'PUT'
                }).success(api.addDeploymentRole).error(function(err){
                    api.toast('Error Committing Deployment Role - '+err.message, 'deployment_role')
                });
            }
        }

        $scope.destroySelected = function() {
            $scope.confirm(event, {
                title: "Destroy Deployment Roles",
                message: "Are you sure you want to destroy the selected deployment roles?",
                yesCallback: function() {
                    deployment_roles.selected.forEach(function(deployment_role) {
                        if(deployment_role.id) {
                            api('/api/v2/deployment_roles/'+deployment_role.id, {
                                method: 'DELETE'
                            }).success(function(){
                                api.remove('deployment_role', deployment_role.id)
                            });                    
                        }

                        deployment_roles.selected = []
                    })
                }
            })
        }

        $scope.destroy = function() {
            $scope.confirm(event, {
                title: "Destroy Deployment Role",
                message: "Are you sure you want to destroy this deployment role?",
                yesCallback: function() {
                    // if we have a valid deployment role selected
                    if($scope.deployment_role.id) {
                        api('/api/v2/deployment_roles/'+$scope.deployment_role.id, {
                            method: 'DELETE'
                        }).success(function(){
                            api.remove('deployment_role', $scope.deployment_role.id)
                            $location.path('/deployment_roles')
                        });                    
                    }
                }
            })
        }

        $scope.id = $routeParams.id
        $scope.deployment_role = {}
        $scope.hasAttrib = -1;
        $scope.attribs = [];
        $scope.editing = false;
        var hasCallback = false;

        var updateDeploymentRole =  function(){
            if($scope.editing) return;

            $scope.deployment_role = $scope._deployment_roles[$scope.id];
            if(!$scope.deployment_role)
                $location.path('/deployment_roles')
            else {
                if($scope.hasAttrib == -1) {
                    api('/api/v2/deployment_roles/'+$scope.deployment_role.id+"/attribs").
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
                    $scope.$on('deployment_role'+$scope.deployment_role.id+"Done", updateDeploymentRole)
                }
            }
        }

        if(Object.keys($scope._deployment_roles).length) {
            updateDeploymentRole()
        } else {
            $scope.$on('deployment_rolesDone',updateDeploymentRole)
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