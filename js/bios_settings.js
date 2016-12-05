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
    $scope.loadSettings = function () {
        api("/api/v2/deployments/system/attribs/bios-set-mapping").
          success(function (obj) {
              $scope.dirty = false;
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

    // called when field is changed
    this.dirtyData = function(dirty) {
      $scope.dirty = true;
    };

    // called when a deployment is clicked
    this.toggleExpand = function (id) {
       $scope.expand[id] = !$scope.expand[id];
    };

    $scope.loadSettings();
  });

})();
