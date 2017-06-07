/*
  Copyright 2017, RackN
  Bios Updates Controller
*/
(function () {
  angular.module('app').controller('BiosUpdatesCtrl', [
    '$mdMedia', '$mdDialog', '$scope', '$http', 'debounce', '$timeout', 'api',
    function ($mdMedia, $mdDialog, $scope, $http, debounce, $timeout, api) {
      $scope.$emit('title', 'Firmware Updates'); // shows up on the top toolbar

      $scope.expand = {};
      $scope.dirty = false;
      $scope.updates = [];
      $scope.role = -1;
      $scope.deployment_role = -1;
      $scope.id = -1;
      $scope.attribute = 'bios-firmware-list';
      $scope.attributes = {
        'bios-firmware-list': 'BIOS',
        'ipmi-firmware-list': 'IPMI'
      };

      $scope.loadUpdates = function () {
        api('/api/v2/roles/bios-flash').then(function (resp) {
          let robj = resp.data;
          $scope.role = robj.id;
          api('/api/v2/deployments/system/deployment_roles')
          .then(function (resp) {
            let drobj = resp.data;
            for (let id in drobj) {
              if (drobj[id].role_id === $scope.role) {
                $scope.deployment_role = drobj[id].id;
                break;
              }
            }
            api('/api/v2/deployment_roles/' + $scope.deployment_role +
              '/attribs/' + $scope.attribute)
            .then(function (resp) {
              let obj = resp.data;
              let temp = obj.value;
              $scope.updates = [];
              $scope.dirty = false;
              $scope.id = obj.id;

              temp.forEach(function(tt) {
                let newobj = {};
                newobj.match = {};
                newobj.package = {};
                Object.keys(tt).forEach(function(key) {
                  if ((key === 'package') || (key === 'package-sha256sum') ||
                      (key === 'package-source') || (key === 'script')) {
                    newobj.package[key] = tt[key];
                  } else {
                    newobj.match[key] = {id: key, value: tt[key]};
                  }
                });
                $scope.updates.push(newobj);
              });
            }, function (err) {
              api.toast('Error Firmware Updates Data',
                $scope.attribute, err.data);
            });
          });
        });
      };

      // called when a deployment is clicked
      this.toggleExpand = function (id) {
        $scope.expand[id] = !$scope.expand[id];
      };

      // called when field is changed
      this.dirtyData = function() {
        $scope.dirty = true;
      };

      $scope.removeValue = function(index, id) {
        delete $scope.updates[index].match[id];
        api.toast('Removed Match ' + id, 'match', index);
        $scope.dirty = true;
      };

      $scope.addValue = function(index) {
        $scope.updates[index].match['not set'] = {
          id: 'not set',
          value: 'undefined'
        };
        $scope.dirty = true;
      };

      // called when a deployment is clicked
      $scope.createUpdate = function (ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        let confirm = $mdDialog.prompt()
          .title('Creating Package')
          .textContent('Package Name:')
          .placeholder('default')
          .ariaLabel('Package')
          .targetEvent(ev)
          .ok('Add')
          .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
          let o = {
            match: {
              'bios-version':  {
                id: 'bios-version',
                value: '0.0.0'
              },
              'system_product': {
                id: 'system_product',
                value: 'model'
              },
              'system_manufacturer': {
                id: 'vendor',
                value: 'system_manufacturer'
              },
            },
            package: {
              'package': result,
              'script': '#!/usr/bin/env bash',
              'package-source': 'http://',
              'package-sha256sum': 'not set',
            }
          };
          $scope.updates.push(o);
          $scope.dirty = true;
        }, function() {
          console.log('did not create');
        });
      };

      $scope.saveSetting = function () {
        let o = [];
        for (const i in $scope.updates) {
          let mypackage = {
            'script': $scope.updates[i].package.script,
            'package': $scope.updates[i].package.package,
            'package-source': $scope.updates[i].package['package-source'],
            'package-sha256sum': $scope.updates[i].package['package-sha256sum']
          };
          let match = $scope.updates[i].match;
          Object.keys(match).forEach(function(key) {
            mypackage[match[key].id] = match[key].value;
          });
          o.push(mypackage);
        }
        let obj = {value: o};
        obj['deployment_role_id'] = $scope.deployment_role;
        //console.log(obj);
        api('/api/v2/deployment_roles/' + $scope.deployment_role +
          '/propose', {
            method: 'PUT'
          })
        .then(function() {
          api('/api/v2/attribs/' + $scope.id, {
            method: 'PUT',
            data: obj
          })
          .then(function() {
            api('/api/v2/deployment_roles/' + $scope.deployment_role +
              '/commit', {
                method: 'PUT'
              })
            .then(function() {
              api.toast('Updated Firmware Attrib!');
            });
          }, function (err) {
            api.toast('Error updating firmware values', 'attribs', err.data);
          });
        });
      };

      $scope.deleteSetting = function(event, id) {
        delete $scope.updates[id];
      };

      $scope.loadUpdates();
    }
  ]);

})();
