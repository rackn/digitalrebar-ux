/*
bios settings controller
*/
(function () {
  angular.module('app').controller('BiosUpdatesCntrl', function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, api, $filter) {
    $scope.$emit('title', 'Firmware Updates'); // shows up on the top toolbar

    var biosupdates = this;

    $scope.expand = {};
    $scope.dirty = false;
    $scope.updates = [];
    $scope.role = -1;
    $scope.deployment_role = -1;
    $scope.id = -1;
    $scope.attribute = "bios-firmware-list";
    $scope.attributes = {"bios-firmware-list": "BIOS", "ipmi-firmware-list": "IPMI"};

    $scope.loadUpdates = function () {
      api("/api/v2/roles/bios-flash").success(function (robj) {
        $scope.role = robj.id;
        api("/api/v2/deployments/system/deployment_roles").
        success(function (drobj) {
          for (var id in drobj) {
            if (drobj[id].role_id == $scope.role) {
              $scope.deployment_role = drobj[id].id;
              break;
            }
          };
          api("/api/v2/deployment_roles/"+$scope.deployment_role+"/attribs/" + $scope.attribute).
          success(function (obj) {
            var temp = obj.value;
            $scope.updates = [];
            $scope.dirty = false;
            $scope.id = obj.id;

            temp.forEach(function(tt) {
              var newobj = {}
              newobj.match = {}
              newobj.package = {}
              Object.keys(tt).forEach(function(key) {
                if ((key == "package") || (key == "package-sha256sum") ||
                    (key == "package-source") || (key == "script")) {
                  newobj.package[key] = tt[key];
                } else {
                  newobj.match[key] = { "id": key, "value": tt[key] };
                }
              });
              $scope.updates.push(newobj)
            });
          }).
          error(function (err) {
            api.toast("Error Firmware Updates Data", $scope.attribute, err);
          });
        });
      });
    };

    // called when a deployment is clicked
    this.toggleExpand = function (id) {
      $scope.expand[id] = !$scope.expand[id];
    };

    // called when field is changed
    this.dirtyData = function(dirty) {
      $scope.dirty = true;
    };

    $scope.removeValue = function(index, id) {
      delete $scope.updates[index].match[id];
      api.toast('Removed Match ' + id, "match", index);
      $scope.dirty = true;
    };

    $scope.addValue = function(index) {
      $scope.updates[index].match["not set"] = { id: "not set", value: "undefined"};
      $scope.dirty = true;
    };

    // called when a deployment is clicked
    $scope.createUpdate = function (ev) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.prompt()
        .title('Creating Package')
        .textContent('Package Name:')
        .placeholder('default')
        .ariaLabel('Package')
        .targetEvent(ev)
        .ok('Add')
        .cancel('Cancel');
      $mdDialog.show(confirm).then(function(result) {
        var o = { "match": {
            "bios-version":{ "id": "bios-version", "value": "0.0.0"},
            "system_product":{ "id": "system_product", "value": "model"},
            "system_manufacturer":{ "id":"vendor", "value": "system_manufacturer"}
          }, "package": {
            "package": result, "script":"#!/usr/bin/env bash", "package-source":"http://", "package-sha256sum":"not set" }
          };
        $scope.updates.push(o);
        $scope.dirty = true;
      }, function() {
        console.log("did not create");
      });
    };

    $scope.saveSetting = function (event, id) {
      var o = []
      for (var i in $scope.updates) {
        var package = { 
          "script": $scope.updates[i].package.script,
          "package": $scope.updates[i].package.package,
          "package-source": $scope.updates[i].package["package-source"],
          "package-sha256sum": $scope.updates[i].package["package-sha256sum"]
        };
        Object.keys($scope.updates[i].match).forEach(function(key) {
          package[$scope.updates[i].match[key].id] = $scope.updates[i].match[key].value;
        });
        o.push(package);
      };
      var obj = { value: o };
      obj["deployment_role_id"] = $scope.deployment_role;
      //console.log(obj);
      api('/api/v2/deployment_roles/' + $scope.deployment_role + "/propose", { method: "PUT" }).
      success(function(data) {
        api('/api/v2/attribs/' + $scope.id, {
          method: 'PUT',
          data: obj
        }).
        success(function(data) { 
          api('/api/v2/deployment_roles/' + $scope.deployment_role + "/commit", { method: "PUT" }).
          success(function(data) { 
            api.toast('Updated Firemware Attrib!');
          });
        }).error(function (err) {
            api.toast('Error updating firmware values', 'attribs', err);
        });
      });
    };

    $scope.deleteSetting = function(event, id) {
      delete $scope.updates[id];
    };

    $scope.loadUpdates();
  });

})();
