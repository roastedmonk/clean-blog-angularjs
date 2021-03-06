
var underscore = angular.module('underscore', []);
underscore.factory('_', ['$window', function($window) {
  return $window._; // assumes underscore has already been loaded on the page
}]);

// CREATE THE MODULE AND NAME IT cleanBlog
var app = angular.module("app", ["ngAnimate", "ui.router", "ngSanitize", "underscore"]);

app.run(['$rootScope', '$state', '$stateParams', function ($rootScope, $state, $stateParams) {
	$rootScope.$state = $state;
	$rootScope.$stateParams = $stateParams;

	$rootScope.page = {};
	$rootScope.page.blog_home = PageDetails.blog_home;
	$rootScope.page.title = PageDetails.post.page_title;
	$rootScope.page.facebook_link = PageDetails.facebook_link;
	$rootScope.page.twitter_link = PageDetails.twitter_link;
	$rootScope.page.email_link = PageDetails.email_link;

	$rootScope.$on('$stateChangeSuccess', function (event, current, previous) {
		$rootScope.page.title = current.title;
	});
}]);

// CONFIGURE OUR ROUTES
app.config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('home', {
			url: '/',
			templateUrl: 'pages/home.html?v='+PageDetails.version_number,
			controller: 'mainController',
			title: PageDetails.post.page_title
		})

		.state('about', {
			url: '/about',
			templateUrl: 'pages/about.html?v='+PageDetails.version_number,
			controller: 'aboutController',
			title: PageDetails.post.page_title + ' - ' + PageDetails.about.page_title
		})

		.state('post', {
			url: '/post/{pgnumber}/{id}/{slug}',
			templateUrl: 'pages/post.html?v='+PageDetails.version_number,
			controller: 'postController',
			title: PageDetails.post.page_title			
		})

		.state('pager', {
			url: '/page/{id}',
			templateUrl: 'pages/home.html?v='+PageDetails.version_number,
			controller: 'mainController',
			title: PageDetails.post.page_title
		})

	//$locationProvider.html5Mode(true);
});

app.directive('btnAutoCollapse', directive);

function directive() {
	var dir = {
		restrict: 'A',
		scope: {},
		link: link
	};
	return dir;

	function link(scope, element, attrs) {
		element.on('click', function (event) {
			$(".navbar-collapse.in").collapse('hide');
		});
	}
}

// Posts Pagination
app.directive('postsPagination', function () {
	return {
		restrict: 'E',
		template: '<ul class="pager" ng-show="pager">' +
		'<li class="previous" ng-show="currentPage != 1">' +
		'<a ui-sref="pager({id:currentPage-1})">&larr; Newer Posts</a>' +
		'</li>' +
		'<li class="next" ng-show="currentPage != totalPages">' +
		'<a ui-sref="pager({id:currentPage+1})">Older Posts &rarr;</a>' +
		'</li>' +
		'</ul>'
	};
});

// Limit the Posts content text on the Post list page/home page
app.filter('limitHtml', function () {
	return function (text, limit) {

		var changedString = String(text).replace(/<[^>]+>/gm, '');
		var length = changedString.length;

		return changedString.length > limit ? changedString.substr(0, limit - 1) + '...' : changedString;
	}
});

// Get current year
app.filter('currentYear', ['$filter', function ($filter) {
	return function () {
		return $filter('date')(new Date(), 'yyyy');
	};
}])

// MAIN CONTROLLER/HOME
app.controller('mainController', function ($scope, $http, $sce, $timeout, $stateParams) {
	$scope.page_title = PageDetails.post.page_title;
	$scope.page_subtitle = PageDetails.post.page_subtitle;

	$scope.date = new Date();

	$scope.posts = [];
	$scope.totalPages = 0;
	$scope.currentPage = 1;
	$scope.range = [];
	$scope.loading = false;
	$scope.pager = false;

	// DATE FORMAT
	$scope.dateFormat = function (dateString) {
		if (dateString) {
			var properlyFormattedDate = dateString.split(" ").join("T");
			return new Date(properlyFormattedDate);
		} else {
			return null;
		}
	};

	// GET POSTS FUNCTION
	$scope.getPosts = function (pageNumber) {

		pageNumber = $stateParams.id;

		if (pageNumber === undefined) {
			pageNumber = '1';
		}

		$scope.loading = true;

		$http.get('json/posts-page-' + pageNumber + '.json?v='+PageDetails.version_number).success(function (response) {
			$scope.posts = response.data;
			$scope.totalPages = response.last_page;
			$scope.currentPage = response.current_page;
			$scope.loading = false;
			$scope.pager = true;


			if (pageNumber > $scope.totalPages) {
				$scope.noResult = true;
				$scope.loading = false;
				$scope.pager = false;
			}
		});
	};

	$scope.getPosts();
});

// POST CONTROLLER
app.controller('postController', function ($scope, $http, $state, $stateParams, _) {
	$scope.page_title = PageDetails.about.page_title;

	if ($stateParams.id == undefined) {
		$state.go('home');
	}

	// DATE FORMAT
	$scope.dateFormat = function (dateString) {
		if (dateString) {
			var properlyFormattedDate = dateString.split(" ").join("T");
			return new Date(properlyFormattedDate);
		} else {
			return null;
		}
	};

	post_id = $stateParams.id;
	_pageNumber = $stateParams.pgnumber;

	$http.get('json/posts-page-' + _pageNumber + '.json?v='+PageDetails.version_number).success(function (response) {
		var lPosts = response.data;
		var postMan = _.find(lPosts, function(goal) {
			return goal.id == post_id;
		});
		if(postMan){
			$scope.post_id = postMan.id;
			$scope.post_date = postMan.post_date;
			$scope.post_title =postMan.post_title;
			$scope.post_author = postMan.author.firstname + ' ' + postMan.author.lastname;
			$scope.post_content = postMan.post_content;
		}
	});
});

// ABOUT CONTROLLER
app.controller('aboutController', function ($scope, $http) {
	$scope.page_title = PageDetails.about.page_title;
	$scope.page_subtitle = PageDetails.about.page_subtitle;
	$scope.profile_image = PageDetails.profile_image;
	$scope.profile_name = PageDetails.profile_name;
});

// Show errors on the Contact page
app.directive('showErrors', function ($timeout, showErrorsConfig) {
	var getShowSuccess, linkFn;

	getShowSuccess = function (options) {
		var showSuccess;
		showSuccess = showErrorsConfig.showSuccess;
		if (options && options.showSuccess != null) {
			showSuccess = options.showSuccess;
		}
		return showSuccess;
	};

	linkFn = function (scope, el, attrs, formCtrl) {
		var blurred, inputEl, inputName, inputNgEl, options, showSuccess, toggleClasses;

		blurred = false;
		options = scope.$eval(attrs.showErrors);
		showSuccess = getShowSuccess(options);
		inputEl = el[0].querySelector('[name]');
		inputNgEl = angular.element(inputEl);
		inputName = inputNgEl.attr('name');
		if (!inputName) {
			throw 'show-errors element has no child input elements with a \'name\' attribute';
		}

		inputNgEl.bind('blur', function () {
			blurred = true;
			return toggleClasses(formCtrl[inputName].$invalid);
		});

		scope.$watch(function () {
			return formCtrl[inputName] && formCtrl[inputName].$invalid;
		}, function (invalid) {
			if (!blurred) {
				return;
			}
			return toggleClasses(invalid);
		});

		scope.$on('show-errors-check-validity', function () {
			return toggleClasses(formCtrl[inputName].$invalid);
		});

		scope.$on('show-errors-reset', function () {
			return $timeout(function () {
				el.removeClass('has-error');
				el.removeClass('has-success');
				return blurred = false;
			}, 0, false);
		});

		return toggleClasses = function (invalid) {
			el.toggleClass('has-error', invalid);
			if (showSuccess) {
				return el.toggleClass('has-success', !invalid);
			}
		};
	};

	return {
		restrict: 'A',
		require: '^form',
		compile: function (elem, attrs) {
			if (!elem.hasClass('form-group')) {
				throw 'show-errors element does not have the \'form-group\' class';
			}
			return linkFn;
		}
	};
});

app.provider('showErrorsConfig', function () {
	var _showSuccess;
	_showSuccess = false;
	this.showSuccess = function (showSuccess) {
		return _showSuccess = showSuccess;
	};
	this.$get = function () {
		return { showSuccess: _showSuccess };
	};
});

app.config(['showErrorsConfigProvider', function (showErrorsConfigProvider) {
	showErrorsConfigProvider.showSuccess(true);
}]);

