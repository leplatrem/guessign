var REMOTE_DB = 'http://leplatrem.iriscouch.com:5984/guessign';


function Store() {
  this._db = new PouchDB('guessign');
  this._default_filter = {'lang': {'$exists': true}};

  this._all_langs = [];
  this._all_categories = [];
  this._all_difficulties = [];
  this._all_words = [];

  this._filtered = [];
  this._available = [];
}

Store.prototype = {
  allLangs: function () {
    return this._all_langs;
  },

  allCategories: function () {
    return this._all_categories;
  },

  allDifficulties: function () {
    return this._all_difficulties;
  },

  /**
   * Fetch from remote database.
   */
  load: function (callback) {
    if (this._all_langs.length > 0) {
      // Already loaded and replicated.
      callback();
      return;
    }

    var remote = new PouchDB(REMOTE_DB);

    var self = this;
    self._db.createIndex({
      name: '_by_lang',
      index: {
        fields: ['lang']
      }
    })
    .then(function () {
      return self._db.createIndex({
        name: '_by_difficulty',
        index: {
          fields: ['difficulty']
        }
      });
    })
    .then(function () {
      return self._db.createIndex({
        name: '_by_category',
        index: {
          fields: ['category']
        }
      });
    })
    .then(function () {
      return remote.info();
    })
    .then(function (info) {
      console.log('Connected with remote database', info);
      return self._db.replicate.from(remote);
    })
    .then(function () {
      // Store list of all distinct langs available.
      return self._db.find({
        selector: self._default_filter,
        fields: ['lang']
      });
    })
    .then(function (result) {
      self._all_langs = self._distinct(result.docs, 'lang');
      // Done.
      callback();
    })
    .catch(function (err) {
      console.error(err);
    });
  },

  filter: function (filters, callback) {
    var selector = _.extend({}, this._default_filter, filters);
    console.log('Filter on', selector);
    this._db.find({
      selector: selector,
    })
    .then(function (result) {
      console.log(result.docs.length, 'levels found.');

      // Extract some attributes from filtered levels.
      this._all_difficulties = this._distinct(result.docs, 'difficulty');
      this._all_categories = this._distinct(result.docs, 'category');
      this._all_words = _.uniq(_.pluck(result.docs, 'word'));

      // Store list of filtered records.
      this._filtered = _.pluck(result.docs, '_id');
      // Reset available levels for player.
      this._available = [];

      callback();
    }.bind(this))
    .catch(function (err) {
      console.error(err);
    });
  },

  next: function (nbchoices, callback) {
    // If all already played, restart again.
    if (this._available.length <= 0) {
      this._available = _.shuffle(this._filtered);
    }
    // Consume a level in shuffled list.
    var random = this._available.splice(0, 1)[0];
    this._db.get(random)
      .then(function (current) {
        // Build list of proposed words.
        var words = current.words || [];

        // If not enough proposed words, pick random to reach number of choices.
        if (nbchoices > words.length) {
          var missing = nbchoices - words.length;
          var extra = _.sample(_.without(this._all_words, words), missing);
          words = words.concat(extra);
        }

        // Add solution to choices.
        words.unshift(current.word);

        // Shuffle choices.
        current.words = _.shuffle(words.slice(0, nbchoices));

        // Done.
        callback(current);
      }.bind(this))
      .catch(function (err) {
        console.error(err);
      });
  },

  /**
   * Return all distinct values of ``property`` within currently filtered levels
   *
   * @param {Arry} list - list of objects.
   * @param {string} property - name of property to lookup.
   * @returns {Array}
   */
  _distinct: function (list, property) {
    var facets = _.pluck(list, property);
    return _.uniq(facets.sort(), true);
  },
};
