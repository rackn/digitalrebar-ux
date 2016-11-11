/*
bios settings controller
*/
(function () {
  angular.module('app').controller('BiosSettingsCntrl', function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, api, $filter) {
    $scope.$emit('title', 'Bios Settings'); // shows up on the top toolbar

    var biossettings = this;

    $scope.expand = {};

    $scope.settings = {};
    $scope.loadSettings = function () {
        api("/api/v2/deployments/system/attribs/bios-set-mapping").
          success(function (obj) {
              var temp = obj.default.value;

              $scope.settings = []
              temp.forEach(function(tt) {
                tt.configs.forEach(function(c) {
                  var newobj = {};

                  newobj.role = tt.role;
                  newobj.name = c.name;
                  newobj.parent = c.parent;
                  newobj.match = {};
                  newobj.values = {};
  
                  Object.keys(tt.match).forEach(function(key) {
                    newobj.match[key] = {};
                    if (typeof tt.match[key] == 'string') {
                      newobj.match[key].pattern = tt.match[key];
                      newobj.match[key].op = 'exact';
                    } else {
                      newobj.match[key].pattern = tt.match[key].match;
                      newobj.match[key].op = tt.match[key].op;
                    }
                  });
                  Object.keys(c.settings).forEach(function(key) {
                    newobj.values[key] = c.settings[key];
                  });

                  $scope.settings.push(newobj);
                });
              });
          }).
          error(function (err) {
            api.toast("Error Bios Setting Data", 'bios_setting', err);
          });
    }

    // called when a deployment is clicked
    this.toggleExpand = function (id) {
      $scope.expand[id] = !$scope.expand[id];
    };

    // creates the node role status data for all the deployments
    // takes a sum of the all the node roles and all the errors
    this.createStatusBarData = function () {
      $scope.$evalAsync(function () {
        for (var id in $scope._deployments) {
          if (!$scope.binding[id])
            $scope.binding = false;
          deployments.deploymentStatus[id] = { error: 0, total: 0 }
          for (var roleId in $scope._node_roles) {
            var node_role = $scope._node_roles[roleId];
            if (node_role.deployment_id != id)
              continue;

            var state = node_role.state;
            if (state == -1)
              deployments.deploymentStatus[id].error++;
            deployments.deploymentStatus[id].total++;
          }
        }
      });
    };

    // creates a confirmation dialog before deleting the deployment
    $scope.deleteDeployment = function (event, id) {
      $scope.confirm(event, {
        title: "Delete Deployment",
        message: "Are you sure you want to delete deployment " + $scope._deployments[id].name + "?",
        yesCallback: function () {
          api("/api/v2/deployments/" + id, { method: "DELETE" }).
          success(function () {
            api.remove("deployment", id);
          }).
          error(function (err) {
            api.toast("Error Deleting Deployment", 'deployment', err);
          })
        }
      });
    };

    $scope.createDeploymentPrompt = function (ev) {
      var confirm = $mdDialog.prompt()
        .title('Create Deployment')
        .textContent('Enter the Name of the New Deployment')
        .placeholder('Deployment Name')
        .targetEvent(ev)
        .ok('Create')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function (name) {
        api('/api/v2/deployments', {
          method: "POST",
          data: {
            name: name
          }
        }).success(api.addDeployment).
        success(function () {
          deployments.createPieChartData();
          deployments.createStatusBarData();
        }).
        error(function (err) {
          api.toast("Couldn't Create Deployment", 'deployment', err);
        });
      }, function () {});
    };

    $scope.loadSettings();
  });

})();
