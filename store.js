function Store() {
  this._currentLang = null;
  this._all_words = [];

  // Every words for the current set of filters.
  this._filtered = [];
  // Remaining words to be played.
  this._available = [];
}

Store.prototype = {
  load: function (filters) {
    var changedLang = (filters.lang !== this._currentLang);
    this._currentLang = filters.lang;
    delete filters.lang;

    var obtainData = Promise.resolve(this._all_words);
    // When lang changes, refetch from server.
    if (changedLang) {
      obtainData = fetch('data/' + this._currentLang + '.json')
        .then(function (response) {
          return response.json();
        })
        .catch(function (err) {
          console.error(err);
        });
    }

    obtainData
      .then(function (words) {
        // Store list of filtered records.
        this._all_words = words;
        console.log(words.length, 'words available.');

        // Filter current list of words.
        console.log('Filter on', filters);
        var filtered = _.where(words, filters);
        console.log(filtered.length, 'words found.');

        // Store set of filtered words.
        this._filtered = filtered;
        // Reset available levels for player.
        this._available = [];

        // Extract attributes from filtered levels.
        this.emit('loaded', {
          difficulties: this._distinct(filtered, 'difficulty'),
          categories: this._distinct(filtered, 'category'),
          classes: this._distinct(filtered, 'class'),
        });
      }.bind(this));
  },

  next: function (nbchoices) {
    // If all already played, restart again.
    if (this._available.length < 1) {
      this._available = _.shuffle(this._filtered);
    }

    // Consume a level in shuffled list.
    var current = this._available.splice(0, 1)[0];

    // Build list of proposed words.
    var prepareWord = Promise.resolve(current);
    if (!current.words || current.words.length < nbchoices) {
      // If not enough proposed words, look for words in same category.
      var selector = {};
      if (current.difficulty)
        selector.difficulty = current.difficulty;
      if (current.category)
        selector.category = current.category;
      if (current.class)
        selector.class = current.class;
      var filtered = selector ? _.where(this._filtered, selector) : this._filtered;
      // Extract words from results.
      var words = _.uniq(_.pluck(filtered, 'word'));
      var extra = _.without(words, current.words);
      current.words = (current.words || []).concat(extra);
      prepareWord = Promise.resolve(current);
    }

    prepareWord
      .then(function (level) {
        // Limit to number of choices.
        level.words = _.sample(level.words, nbchoices - 1);
        // Add solution to choices.
        level.words.unshift(level.word);
        // Shuffle choices.
        level.words = _.shuffle(_.uniq(level.words));

        // Word picked!
        console.log('Picked', level);
        console.log(this._available.length, ' words left.');
        this.emit('next', level);
      }.bind(this));
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
    return _.uniq(facets).sort();
  },

  /**
   * Event emitter functions.
   */
  on: function(event, callback) {
    this._listeners = this._listeners || {};
    this._listeners[event] = (this._listeners[event] || []);
    this._listeners[event].push(callback);
  },

  emit: function(event, data) {
    var listeners = this._listeners || {};
    var callbacks = listeners[event] || [];
    callbacks.map(function (cb) { cb(data); });
  },
};
