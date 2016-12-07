/*
bios settings controller
*/
(function () {
  angular.module('app').controller('BiosSettingsCntrl', function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, api, $filter) {
    $scope.$emit('title', 'Bios Settings'); // shows up on the top toolbar

    var biossettings = this;

    $scope.expand = [];
    $scope.dirty = false;
    $scope.settings = [];
    $scope.role = -1;
    $scope.deployment_role = -1;
    $scope.id = -1;

    $scope.loadSettings = function () {
      api.get_id("/api/v2/roles/bios-discover").
      success(function (robj) {
        $scope.role = robj.id;
        api("/api/v2/deployments/system/deployment_roles").
        success(function (drobj) {
          for (var id in drobj) {
            if (drobj[id].role_id == $scope.role) {
              $scope.deployment_role = drobj[id].id;
              break;
            }
          };
          api("/api/v2/deployment_roles/"+$scope.deployment_role+"/attribs/bios-set-mapping").
          success(function (obj) {
            $scope.dirty = false;
            $scope.id = obj.id;
            $scope.settings = []
            obj.value.forEach(function(tt) {
              tt.configs.forEach(function(c) {
                var newobj = {};

                newobj.role = tt.role;
                newobj.name = c.name;
                newobj.parent = c.parent;
                newobj.match = [];
                newobj.values = [];

                Object.keys(tt.match).forEach(function(key) {
                  var om = { id: key};
                  if (typeof tt.match[key] == 'string') {
                    om.pattern = tt.match[key];
                    om.op = 'exact';
                  } else {
                    om.pattern = tt.match[key].match;
                    om.op = tt.match[key].op;
                  }
                  newobj.match.push(om);
                });
                Object.keys(c.settings).forEach(function(key) {
                  var ov = {id: key, value: c.settings[key]};
                  newobj.values.push(ov);
                });
                $scope.settings.push(newobj);
              });
            });
          }).
          error(function (err) {
            api.toast("Error Bios Setting Data", 'bios_setting', err);
          });
        });
      });
    }

    // called when field is changed
    this.dirtyData = function(dirty) {
      $scope.dirty = true;
    };

    // called when a deployment is clicked
    this.toggleExpand = function (id) {
       $scope.expand[id] = !$scope.expand[id];
    };

    // called when a deployment is clicked
    $scope.saveSetting = function (event, id) {
      var roles = {};
      $scope.settings.forEach(function(block) {
        if (!roles[block.role])
          roles[block.role] = {role: block.role, configs: [], match: {}};
        var c = { name:block.name, settings:{} };
        if (block.parent)
          c.parent = block.parent;
        block.values.forEach(function(s) {
          c.settings[s.id] = s.value;
        });
        roles[block.role].configs.push(c);
        if (block.name=='default') {
          block.match.forEach(function(m) {
            if (m.op=='exact') {
              roles[block.role].match[m.id] = m.pattern;
            } else {
              roles[block.role].match[m.id] = {op: m.op, match: m.pattern, __sm_leaf: "true,"};
            }
          });
        }
      });
      var data = [];
      for (var r in roles) {
        data.push(roles[r]);
      };
      var obj = { value: data };
      obj["deployment_role_id"] = $scope.deployment_role;
      api('/api/v2/deployment_roles/' + $scope.deployment_role + "/propose", { method: "PUT" }).
      success(function(data) {
        api('/api/v2/attribs/' + $scope.id, {
          method: 'PUT',
          data: obj
        }).
        success(function(data) { 
          api.toast('Updated Attrib!');
          api('/api/v2/deployment_roles/' + $scope.deployment_role + "/commit", { method: "PUT" }).
          success(function() {
            api.toast('Committed!');
            $scope.dirty = false;
          });
        }).error(function (err) {
            api.toast('Error updating values', 'attribs', err);
        });
      });
      //console.log(roles);
    };

    // called when a deployment is clicked
    $scope.deleteSetting = function (event, id) {
      $scope.dirty = true;
      delete $scope.settings[id];
    };

    $scope.loadSettings();
  });

})();
