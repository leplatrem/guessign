var levels = [
  {
    word: "Jouer",
    words: ["Manger", "Démarrer", "Sauter"],
    lang: "fr",
    category: "Verbe",
    difficulty: "Facile",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/13/49199.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Explain",
    words: ["Express", "Play", "Shake"],
    lang: "en-US",
    category: "Verb",
    difficulty: "Easy",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/13/92972.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Sorry",
    words: ["Hurt", "Worry", "Sour"],
    lang: "en-US",
    category: "Interjection",
    difficulty: "Easy",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/13/58480.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Salle de classe",
    words: ["Cantine", "Spectacle", "Tableau"],
    lang: "fr",
    category: "À l'école",
    difficulty: "Moyen",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/10/5491.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Aimer",
    words: ["Bonjour", "Retourner", "Offrir"],
    lang: "fr",
    category: "Émotions",
    difficulty: "Facile",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/10/4817.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Vérité",
    words: ["Confiance", "Hérité", "Varicelle"],
    lang: "fr",
    category: "Émotions",
    difficulty: "Moyen",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/10/20320.mp4",
      attributions: "Spreadthesign.com"
    },
  },
  {
    word: "Je refuse",
    words: [],
    lang: "fr",
    category: "Verbe",
    difficulty: "Difficile",
    video: {
      url: "http://www.youtubeinmp4.com/redirect.php?video=HPSCgRCbqdk",
      attributions: "sourds.net"
    },
  },
  {
    word: "Gros",
    words: ["Gonflé"],
    lang: "fr",
    category: "Mot",
    difficulty: "Facile",
    video: {
      url: "http://www.youtubeinmp4.com/redirect.php?video=OymHJKAHE4c",
      attributions: "sourds.net"
    },
  },
  {
    word: "Coton",
    words: ["Fleur"],
    lang: "fr",
    category: "Mot",
    difficulty: "Facile",
    video: {
      url: "http://www.youtubeinmp4.com/redirect.php?video=IL_xf2grN8U",
      attributions: "sourds.net"
    },
  },
];


function Store() {
  this._levels = levels;
  this._filtered = levels;
  this._current = null;
  this._index = -1;
};

Store.prototype = {
  setFilters: function (filters) {
     var matching = _.where(this._levels, filters);
     this._filtered = _.shuffle(matching);
  },

  /**
   * Return all distinct values of ``property`` within currently filtered levels
   *
   * @param {string} property - name of property to lookup.
   * @param {bool} complete - if true, lookup property on all available levels.
   * @returns {Array}
   */
  facetList: function (property, complete) {
    var list = complete ? this._levels : this._filtered;
    var facets = _.pluck(list, property);
    return _.uniq(facets.sort(), true);
  },

  getCurrent: function () {
    if (!this._current) {
      this.pickNext();
    }
    return this._current;
  },

  pickNext: function () {
    this._index = (this._index + 1) % this._filtered.length;
    this._current = this._filtered[this._index];
  },

  getSampleWords: function (size) {
    var words = this._current.words || [];

    // If not enough proposed words, pick random to reach number of choices.
    if (size > words.length) {
      var others = _.uniq(_.flatten(_.pluck(this._filtered, 'words')));
      var extra = _.sample(_.without(others, words), size - words.length);
      words = words.concat(extra);
    }

    // Remove solution from choices.
    words.unshift(this._current.word);

    // Shuffle propositions.
    return _.shuffle(words.slice(0, size));
  },
};
