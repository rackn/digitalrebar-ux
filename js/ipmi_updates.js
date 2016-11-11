/*
bios settings controller
*/
(function () {
  angular.module('app').controller('IPMIUpdatesCntrl', function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, api, $filter) {
    $scope.$emit('title', 'IPMI Updates'); // shows up on the top toolbar

    var ipmiupdates = this;

    $scope.expand = {};

    $scope.updates = {};
    $scope.loadSettings = function () {
        api("/api/v2/deployments/system/attribs/ipmi-firmware-list").
          success(function (obj) {
              var temp = obj.default.value;

              $scope.updates = []

              temp.forEach(function(tt) {
                var newobj = {}
                newobj.match = {}
                newobj.package = {}
                Object.keys(tt).forEach(function(key) {
                  if ((key == "package") || (key == "package-sha256sum") ||
                      (key == "package-source") || (key == "script")) {
                    newobj.package[key] = tt[key]
                  } else {
                    newobj.match[key] = tt[key]
                  }
                });
                $scope.updates.push(newobj)
              });
              console.log("GREG: obj = ", $scope.updates);
          }).
          error(function (err) {
            api.toast("Error IPMI Updates Data", 'ipmi_updates', err);
          });
    }

    // called when a deployment is clicked
    this.toggleExpand = function (id) {
      $scope.expand[id] = !$scope.expand[id];
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
