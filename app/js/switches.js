/*
  Copyright 2017, RackN
  Switch Controller
*/
(function () {
  angular.module('app').controller('SwitchesCtrl', [
    '$scope', '$location', 'debounce', '$routeParams', '$mdMedia', '$mdDialog',
    'api',
    function ($scope, $location, debounce, $routeParams, $mdMedia, $mdDialog,
      api) {
      $scope.$emit('title', 'Switches'); // shows up on the top toolbar

      $scope.sweetches = {};
      $scope.layout = [];
      for (var p=1; p<49; p+=2)
        $scope.layout.push(p);

      $scope.$on('nodesDone', function () {
        // converts the _nodes object that rootScope has into an array
        var nodes = [];
        // collect nodes of interest
        for (var id in $scope._nodes) {
          if (!$scope._nodes[id].system)
            nodes.push($scope._nodes[id].id);
        }
        for (var nid in nodes) {
          api('/api/v2/nodes/' + nodes[nid] + '/attribs/ports').
          then(function (resp) {
            var value = resp.data;
            // remove non-action power options
            var node = $scope._nodes[value.node_id];
            if (typeof value.value.lldp === 'undefined' ) {
              console.log('switches: missing lldp data for node ' + node.id + ' using fake data for testing');
              value.value = $scope.fakeValue(node.id);
            }
            for (var nic in value.value.lldp) {
              var sw = value.value.lldp[nic].chassis.mac;
              var raw = value.value.lldp[nic].port.descr;
              var ports = raw.match(/([0-9]*)\/([0-9]*)\/([0-9]*)/);
              var port = parseInt(ports[3])
              //console.log(sw);
              //console.log(nic); 
              //console.log(port);

              if (!$scope.sweetches[sw]) {
                var ports = {}
                for (var p=1; p<49; p++)
                  ports[p] = [];
                $scope.sweetches[sw] = {
                  switch: {
                    mac: sw,
                    description: value.value.lldp[nic].chassis.descr,
                  },
                  ports: ports,
                };
              }
              if (!$scope.sweetches[sw][port]) {
                $scope.sweetches[sw].ports[port] = [];
              }
              nodemap = { id: node.id, name: node.name, nic: nic };
              $scope.sweetches[sw].ports[port].push(nodemap);
            }
          });
        };
      });

      $scope.fakeValue = function (node_id) {
        return {
          'lldp': {
            'eth0': {
              'age': '0 day, 00:00:58',
              'chassis': {
                'Bridge': {
                  'enabled': 'on'
                },
                'Router': {
                  'enabled': 'on'
                },
                'descr': 'Juniper Networks, Inc. qfx5100-24q-2p Ethernet Switch, kernel JUNOS 13.2X51-D38, Build date: 2015-06-12 02:33:47 UTC Copyright (c) 1996-2015 Juniper Networks, Inc.',
                'mac': ( node_id % 2 == 0 ? '20:4e:71:32:ca:fe' : '20:4e:71:32:be:ef'),
                'mgmt-ip': '192.168.105.2',
                'ttl': '120'
              },
              'port': {
                'descr': 'xe-0/0/' + node_id % 48 + ':1',
                'local': '2' + node_id,
              },
              'rid': '1',
              'via': 'LLDP'
            },
          'eth1': {
              'age': '0 day, 00:00:58',
              'chassis': {
                'Bridge': {
                  'enabled': 'on'
                },
                'Router': {
                  'enabled': 'on'
                },
                'descr': 'Juniper Networks, Inc. qfx5100-24q-2p Ethernet Switch, kernel JUNOS 13.2X51-D38, Build date: 2015-06-12 02:33:47 UTC Copyright (c) 1996-2015 Juniper Networks, Inc.',
                'mac': ( node_id % 2 == 0 ? '20:4e:71:32:be:ef' : '20:4e:71:32:ca:fe'),
                'mgmt-ip': '192.168.105.2',
                'ttl': '120'
              },
              'port': {
                'descr': 'xe-0/0/' + (node_id+24) % 48 + ':1',
                'local': '3' + node_id,
              },
              'rid': '1',
              'via': 'LLDP'
            }
          },
          'status': 'Success'
        };
      };
    }
  ]);
})();
