'use strict';

var periodPicker = angular.module('period-picker', []);

periodPicker.directive('periodPicker', ['$rootScope', '$log' , '$compile' , '$document',
	function ($rootScope, $log, $compile, $document) {

		var bindMonth = function (scope, month) {

			month.firstDateOfMonth = moment([month.year, month.month, 1]).startOf('day');
			month.lastDateOfMonth = moment([month.year, month.month, 1]).add('month', 1).add('day', -1).endOf('day');

			var firstMonday = moment(month.firstDateOfMonth);
			while (firstMonday.weekday() != 1) { // Monday
				firstMonday = firstMonday.add('day', -1);
			}

			var lastSunday = moment(month.lastDateOfMonth);
			while (lastSunday.weekday() != 0) {
				lastSunday = lastSunday.add('day', 1);
			}

			var dayCount = lastSunday.diff(firstMonday, 'days');
			var weekcount = parseInt(Math.ceil(dayCount / 7.0));

			var today = moment().startOf('day');
			var currentDate = firstMonday;
			for (var week = 0; week < weekcount; week++) {
				var w = {
					week: currentDate.isoWeek(),
					days: [],
					firstDate: moment(currentDate).startOf('day'),
					lastDate: moment(currentDate).add('day', 6).endOf('day'),
					select: function () {
						scope.model.from = this.firstDate;
						scope.model.to = this.lastDate.diff(scope.model.max, 'day') >= 0 ? scope.model.max : this.lastDate;
						scope.model.name = 'Custom';
						scope.intervalName = 'Semaine ' + this.week;
						scope.selectInterval();
					}
				};
				month.weeks.push(w);
				for (var day = 1; day < 8; day++) {
					var dd = moment(currentDate).startOf('day');
					var d = {
						date: dd,
						dayId: dd.date(),
						isToday: today.dayOfYear() == dd.dayOfYear() && dd.month() == month.month,
						isInMonth: dd.month() == month.month,
						isDisabled: scope.model.max.diff(dd, 'day') < 0 || scope.model.min.diff(dd, 'day') > 0,
						isWeekEnd : dd.weekday() == 0 || dd.weekday() == 6,
						select: function () {
							if (this.isDisabled) {
								return;
							}
							if (scope.selectableInterval == 'from') {
								scope.model.from = this.date;
								scope.selectableInterval = 'to';
							} else {
								scope.model.to = this.date;
								scope.selectableInterval = 'from';
							}
							scope.model.name = 'Custom';
							scope.intervalName = null;
							scope.selectInterval();
						}
					};
					w.days.push(d);
					currentDate = currentDate.add('day', 1);
				}
			}
		}

		return {
			restrict: 'E',
			require: 'ngModel',
			templateUrl: 'periodpicker.html',
			scope : true,
			controller: ['$scope', function ($scope) {
				$scope.weekDays = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'];
				$scope.showCalendar = false;
				$scope.toggleCalendar = function () {
					$scope.showCalendar = !$scope.showCalendar;
				}
				$scope.selectInterval = function () {
					angular.forEach($scope.months, function (month) {
						angular.forEach(month.weeks, function (week) {
							angular.forEach(week.days, function (day) {
								day.isInInterval = day.date >= $scope.model.from
												&& day.date <= $scope.model.to
												&& day.isInMonth;

							});
						});
					});
				}
				$scope.applyPeriod = function (period) {
					if (period.name != 'Custom') {
						$scope.model.from = period.from;
						$scope.model.to = period.to;
					} else {
						period.from = $scope.model.from;
						period.to = $scope.model.to;
					}
					$scope.selectInterval();
					$scope.model.selectedPeriod = period.getPeriodName();
					var daycount = $scope.model.to.diff($scope.model.from, 'day') + 1;
					$scope.model.selectedPeriodInfo = 'période sélectionnée : ' + daycount + ' jour' + ((daycount > 1) ? 's' : '');
				}
				$scope.applyChange = function (fromButton) {
					var period = {};
					angular.forEach($scope.periodList, function (item) {
						if (item.name == $scope.model.name) {
							period = item;
						}
					});
					$scope.applyPeriod(period, close);
					if (fromButton) {
						$scope.showCalendar = false;
					}
				};
				$scope.months = [];
				$scope.selectableInterval = 'from';
				$scope.periodList = [
					{
						name: 'FromStart',
						display: 'Depuis le début',
						init : function() {
							this.from = $scope.model.min;
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return 'depuis le ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'SinceOneYear',
						display: 'Depuis un an',
						init : function() {
							this.from = moment().add('year', -1);
							this.from = moment([this.from.year(), this.from.month(), 1]);
							this.from = this.from.startOf('day');
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' du ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'SinceOneMonth', 
						display: 'Depuis un mois',
						init: function () {
							this.from = moment().add('month', -1);
							this.from = moment([this.from.year(), this.from.month(), 1]);
							this.from = this.from.startOf('day');
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'SinceOneWeek',
						display: 'Depuis une semaine',
						init: function () {
							this.from = moment().add('day', -7);
							while (this.from.weekday() != 1) { // Monday
								this.from = this.from.add('day', -1);
							}
							this.from = this.from.startOf('day');
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'SinceBeginOfYear',
						display: 'Depuis le début de l\'année',
						init: function () {
							this.from = moment();
							this.from = moment([this.from.year(), 0, 1]);
							this.from = this.from.startOf('day');
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'LastYear',
						display: 'L\'année dernière',
						init: function () {
							this.from = moment().add('year', -1);
							this.from = moment([this.from.year(), 0, 1]);
							this.from = this.from.startOf('day');
							this.to = moment([this.from.year(), 11, 31]);
							this.to = this.to.endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'LastMonth',
						display: 'Le mois dernier',
						init: function () {
							this.from = moment().add('month', -1);
							this.from = moment([this.from.year(), this.from.month(), 1]);
							this.from = this.from.startOf('day');
							this.to = moment([this.from.year(), this.from.month() + 1, 1]).add('day',-1);
							this.to = this.to.endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'LastWeek',
						display: 'La semaine dernière',
						init: function () {
							this.from = moment().add('day', -7);
							while (this.from.weekday() != 1) { // Monday
								this.from = this.from.add('day', -1);
							}
							this.from = this.from.startOf('day');
							this.to = moment(this.from).add('day', 6);
							this.to = this.to.endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'SinceBeginOfMonth', 
						display: 'Depuis le début du mois',
						init: function () {
							this.from = moment();
							this.from = moment([this.from.year(), this.from.month(), 1]);
							this.from = this.from.startOf('day');
							this.to = moment().endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'Today',
						init: function () {
							this.from = moment().startOf('day');
							this.to = moment().endOf('day');
						},
						display: 'Aujourd\'hui',
						getPeriodName: function () {
							return this.display + this.from.format(' dddd DD MMMM YYYY');
						}
					},
					{
						name: 'Yesterday',
						init: function () {
							this.from = moment().add('day', -1).startOf('day');
							this.to = moment().add('day', -1).endOf('day');
						},
						display: 'Hier',
						getPeriodName: function () {
							return this.display + this.from.format(' dddd DD MMMM YYYY');
						}
					},
					{
						name: 'ThisWeek', 
						display: 'Cette semaine',
						init: function () {
							this.from = moment();
							while (this.from.weekday() != 1) { // Monday
								this.from = this.from.add('day', -1);
							}
							this.from = this.from.startOf('day');
							this.to = moment(this.from).add('day', 7);
							this.to = this.to.endOf('day');
						},
						getPeriodName: function () {
							return this.display + ' ' + this.from.format('dddd DD MMMM YYYY') + ' jusqu\'au ' + this.to.format('dddd DD MMMM YYYY');
						}
					},
					{
						name: 'Custom',
						display: 'Periode personnalisée',
						from: null,
						to:null,
						init: function () {
						},
						getPeriodName: function () {
							if (this.from.diff(this.to, 'day') == 0) {
								return 'le ' + this.from.format('dddd DD MMMM YYYY');
							}
							if ($scope.intervalName != null) {
								return $scope.intervalName + ' du ' + this.from.format('dddd DD MMMM YYYY') + ' au ' + this.to.format('dddd DD MMMM YYYY');
							}
							return 'du ' + this.from.format('dddd DD MMMM YYYY') + ' au ' + this.to.format('dddd DD MMMM YYYY');
						}
					}
				];
			}],
			link: function (scope, element, attrs, ngModel) {

				/*
				$document = angular.element($document);
				var docClickHandler = function () {
					$log.debug('click' + scope.showCalendar);
					scope.showCalendar = false;
				};

				$document.on('click', docClickHandler );
				scope.$on('$destroy', function () {
					return $document.off('click', docClickHandler);
				}); */

				scope.$watch(function () {
					return ngModel.$modelValue;
				}, function (model) {
					scope.model = model;
					scope.model.max = scope.model.max.startOf('day');
					scope.model.min = scope.model.min.startOf('day');
					var startMonth = moment(model.max).add('month', -2);
					for (var i = 0; i < 3; i++) {
						var month = {
							name: startMonth.format('MMMM YYYY'),
							year: startMonth.year(),
							month : startMonth.month(),
							weeks: [],
							select: function () {
								scope.model.from = this.firstDateOfMonth;
								scope.model.to = this.lastDateOfMonth.diff(scope.model.max, 'day') >= 0 ? scope.model.max : this.lastDateOfMonth;
								scope.model.name = 'Custom';
								scope.intervalName = this.name;
								scope.selectInterval();
							}
						};
						bindMonth(scope, month);
						scope.months.push(month);
						startMonth = startMonth.add('month', 1);
					}
					angular.forEach(scope.periodList, function (item) {
						item.init();
						if (item.from < model.min) {
							item.from = model.min;
						}
						if (item.to > model.max) {
							item.to = model.max;
						}
						if (item.to < item.from) {
							item.to = item.from;
						}
						if (item.name == model.name) {
							scope.applyPeriod(item);
						}
					});
				});

				scope.$watch('model.from', function (value) {
					if (typeof (value) !== 'object') {
						var parts = value.split('-');
						if (parts.length != 3) {
							scope.model.from = moment().startOf('day');
							return;
						}
						if (scope.model.from < scope.model.min) {
							scope.model.from = scope.model.min;
						}
						scope.model.from = moment([parts[2], parts[1] - 1, parts[0]]);
						scope.selectInterval();
					}
				});

				scope.$watch('model.to', function (value) {
					if (typeof (value) !== 'object') {
						var parts = value.split('-');
						if (parts.length != 3) {
							scope.model.to = moment().endOf('day');
							return;
						}
						scope.model.to = moment([parts[2], parts[1] - 1, parts[0]]);
						if (scope.model.to > scope.model.max) {
							scope.model.to = scope.model.max;
						}
						scope.selectInterval();
					}
				});

			}
		}
	}
]);

periodPicker.directive('periodDate', function () {
	return {
		require: 'ngModel',
		link: function (scope, element, attrs, ngModel) {
			ngModel.$formatters.push(function (data) {
				var result = moment(new Date(data)).format('DD-MM-YYYY');
				return result;
			});
		}
	};
});

