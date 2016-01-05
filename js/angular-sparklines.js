// Requires jQuery from http://jquery.com/
// and jQuerySparklines from http://omnipotent.net/jquery.sparkline

// AngularJS directives for jquery sparkline
angular.module('sparkline', ['debounce'])
    .directive('spark', ['$timeout', 'debounce', function ($timeout, debounce) {
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
                
                scope.$watch(attrs.opts,function () {
                    render();
                });

                var render = function () {
                    var model;

                    if(attrs.opts) angular.extend(opts, angular.fromJson(attrs.opts));
                    // Trim trailing comma if we are a string
                    angular.isString(ngModel.$viewValue) ? model = ngModel.$viewValue.replace(/(^,)|(,$)/g, "") : model = ngModel.$viewValue;
                    var data;
                    // Make sure we have an array of numbers
                    if(!model) {
                        return
                    }
                    
                    if(angular.isArray(model)){
                        data = model;
                    } else if(angular.isObject(model)) {
                        data = []
                        var sum = 0
                        for(var key in model) {
                            sum += model[key];
                            data.push(model[key]);
                        }
                        if(sum == 0) {
                            return
                        }
                    } else {
                        data = model.split(',');
                    }
                    $(elem).sparkline(data, opts);
                };
            }
        }
    }]);