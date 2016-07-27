'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fetchPonyfill = require('fetch-ponyfill');

var _fetchPonyfill2 = _interopRequireDefault(_fetchPonyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fetch = (0, _fetchPonyfill2.default)();

/**
 * Graphin request cache class
 * @param {*} data – Any data to cache
 * @param {number} ttl – Time to live in ms
 * @constructor
 */

var GraphinCache = function () {
	function GraphinCache(data, ttl) {
		(0, _classCallCheck3.default)(this, GraphinCache);

		this._ttl = ttl || 0;
		this.update(data);
	}

	/**
  * Update cached data
  * @param {*} newData – New data
  * @returns {GraphinCache}
  */


	(0, _createClass3.default)(GraphinCache, [{
		key: 'update',
		value: function update(newData) {
			this._data = newData;
			this._timestamp = Number(new Date());
			return this;
		}

		/**
   * Returns cached data
   * @returns {*}
   */

	}, {
		key: 'getData',
		value: function getData() {
			return this._data;
		}

		/**
   * Check if cache is outdated
   * @returns {boolean}
   */

	}, {
		key: 'isOutdated',
		value: function isOutdated() {
			return Number(new Date()) - this._timestamp > this._ttl;
		}
	}]);
	return GraphinCache;
}();

/**
 * @param {Error} err – GraphQL error object
 * @constructor
 */


var GraphinError = function (_Error) {
	(0, _inherits3.default)(GraphinError, _Error);

	function GraphinError(err) {
		(0, _classCallCheck3.default)(this, GraphinError);
		return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(GraphinError).call(this, err.message));
	}

	return GraphinError;
}(Error);

/**
 * Graphin class
 * @param {string} endpoint – GraphQL endpoint URL
 * @constructor
 */


var Graphin = function () {
	function Graphin(endpoint) {
		(0, _classCallCheck3.default)(this, Graphin);

		if (typeof endpoint !== 'string') {
			throw new Error('The first argument must be a string containing GraphQL endpoint URL');
		}
		this.getQueryURL = function (query) {
			var inlineQuery = encodeURIComponent(query);
			return endpoint + '?query=' + inlineQuery;
		};

		this._cacheStorage = {};
	}

	/**
  * Fetches query
  * @param {string} url – Url to fetch
  * @param {object} options – Request options
  * @param {'omit'|'same-origin'|'include'|undefined} options.credential – Should send cookies
  * @returns {Promise}
  * @private
  */


	(0, _createClass3.default)(Graphin, [{
		key: '_fetch',
		value: function _fetch(url) {
			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			return fetch(url, options).then(function (response) {
				if (!response.ok) {
					return response.json().then(function (data) {
						if (data.errors) {
							throw new GraphinError(data.errors[0]);
						}
						return data.data;
					});
				}
				throw new Error('Request error: ' + response.statusText);
			});
		}

		/**
   * Makes GraphQL Query
   * @param {string} query – GraphQL Query
   * @param {object|undefined} options – Request options. Default {}
   * @param {number} options.cache – Time to live cache in ms
   * @param {object} options.fetch – Fetch options
   * @returns {Promise}
   */

	}, {
		key: 'query',
		value: function query(_query) {
			var _this2 = this;

			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var queryURL = this.getQueryURL(_query);
			var fetchOptions = options.fetch || {};
			fetchOptions.method = fetchOptions.method || 'GET';
			fetchOptions.credential = fetchOptions.credential || 'omit';

			if (options.cache && this._cacheStorage[queryURL] && !this._cacheStorage[queryURL].isOutdated()) {
				return _promise2.default.resolve(this._cacheStorage[queryURL].getData());
			}

			if (typeof _query !== 'string') {
				throw new Error('Query must be a string');
			}

			return this._fetch(queryURL, fetchOptions).then(function (data) {
				if (options.cache) {
					if (_this2._cacheStorage[queryURL]) {
						_this2._cacheStorage[queryURL].update(data);
					} else {
						_this2._cacheStorage[queryURL] = new GraphinCache(data, options.cache);
					}
				}
				return data;
			});
		}

		/**
   * Makes GraphQL Mutation
   * @param {string} url – GraphQL Query
   * @param {object|undefined} options – Request options. Default {}
   * @param {number} options.cache – Time to live cache in ms
   * @param {object} options.fetch – Fetch options
   * @returns {Promise}
   */

	}, {
		key: 'mutation',
		value: function mutation(query) {
			var _this3 = this;

			var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

			var queryURL = this.getQueryURL(query);
			var fetchOptions = options.fetch || {};
			fetchOptions.method = fetchOptions.method || 'POST';
			fetchOptions.credential = fetchOptions.credential || 'omit';

			if (options.cache && this._cacheStorage[queryURL] && !this._cacheStorage[queryURL].isOutdated()) {
				return _promise2.default.resolve(this._cacheStorage[queryURL].getData());
			}

			if (typeof query !== 'string') {
				throw new Error('Query must be a string');
			}

			return this._fetch(queryURL, fetchOptions).then(function (data) {
				if (options.cache) {
					if (_this3._cacheStorage[queryURL]) {
						_this3._cacheStorage[queryURL].update(data);
					} else {
						_this3._cacheStorage[queryURL] = new GraphinCache(data, options.cache);
					}
				}
				return data;
			});
		}
	}]);
	return Graphin;
}();

exports.default = Graphin;