// Requires jQuery from http://jquery.com/
// and jQuerySparklines from http://omnipotent.net/jquery.sparkline

// AngularJS directives for jquery sparkline
angular.module('sparkline', []);
 
angular.module('sparkline')
    .directive('spark', [function () {
        'use strict';
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, elem, attrs, ngModel) {
 
                 var opts={};
                 //TODO: Use $eval to get the object
                opts.type = attrs.type || 'line';

                scope.$watch(attrs.ngModel, function () {
                    render();
                });
                
                scope.$watch(attrs.opts, function(){
                  render();
                });

                var render = function () {
                    var model;
                    if(attrs.opts) angular.extend(opts, angular.fromJson(attrs.opts));
                    // Trim trailing comma if we are a string
                    angular.isString(ngModel.$viewValue) ? model = ngModel.$viewValue.replace(/(^,)|(,$)/g, "") : model = ngModel.$viewValue;
                    var data;
                    // Make sure we have an array of numbers
                    if(angular.isArray(model)){
                        data = model;
                    } else if(angular.isObject(model)) {
                        data = []
                        for(var key in model) {
                            data.push(model[key]);
                        }
                    } else {
                        data = model.split(',');
                    }
                    $(elem).sparkline(data, opts);
                };
            }
        }
    }]);