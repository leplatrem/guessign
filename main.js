/** @jsx React.DOM */

var DEFAULT_CHOICES = 3;


var VideoPlayer = React.createClass({
  render: function() {
    if (!this.props.video.url) {
      return <div className="player"></div>;
    }
    return (
      <div className="player">
        <video src={this.props.video.url} autoPlay controls></video>
        <div className="attributions">&copy; {this.props.video.attributions}</div>
      </div>
    );
  }
});


var WordsCloud = React.createClass({
  onWordClick: function (word) {
    this.props.onPlay(word);
  },

  render: function() {
    var wordButton = function(word, i) {
      var font = this.props.font;
      var lettercase = this.props.lettercase;

      var onWordClick = this.onWordClick.bind(this, word);

      return <div key={i}
        className={'word font--' + font + ' case--' + lettercase}
        onClick={onWordClick}>{word}</div>;
    };

    return (
      <div className="guess">
        <div className="words">
          {(this.props.level.words || []).map(wordButton.bind(this))}
        </div>
      </div>
    );
  }
});


var GameControls = React.createClass({
  getInitialState: function() {
    // Already configured ?
    var config = localStorage.getItem('config');

    if (config) {
      config = JSON.parse(config);
    }
    else {
      config = {};
      // Detect language from browser
      if (this.props.langs.indexOf(i18n.language.short) >= 0) {
        config.lang = i18n.language.short;
      }
      if (this.props.langs.indexOf(i18n.language.long) >= 0) {
        config.lang = navigator.language;
      }
    }

    return {config: config};
  },

  componentDidMount: function() {
    // Make sure parent is aware of config restored from localStorage
    this.props.onConfigure(this.state.config);
  },

  onChange: function (event) {
    if (event.target.name == 'lang') {
      if (!event.target.value) {
        // Do nothing. Lang cannot be unset.
        return;
      }
      // Remove every other filters when lang is changed.
      this.state.config = {lang: event.target.value};
    }
    else {
      if (event.target.value) {
        this.state.config[event.target.name] = event.target.value;
      }
      else {
        delete this.state.config[event.target.name];
      }
    }

    // Save for next visit
    localStorage.setItem('config', JSON.stringify(this.state.config));

    // Notify parent
    this.props.onConfigure(this.state.config);
  },

  render: function() {
    var comboBox = function (property, options) {
      return <div className={'control control--' + property}>
        <select name={property}
                value={this.state.config[property]}
                onChange={this.onChange}>
          <option value="">{i18n.tr(property)}...</option>
          {options.map(function (option, index) {
            return <option key={index} value={option}>{i18n.tr(option)}</option>
          })}
        </select>
      </div>
    }

    return (
      <div className="controls">
        {comboBox.call(this, 'lang', this.props.langs)}
        {comboBox.call(this, 'category', this.props.categories)}
        {comboBox.call(this, 'class', this.props.classes)}

        {comboBox.call(this, 'font', this.props.fonts)}
        {comboBox.call(this, 'lettercase', this.props.lettercases)}
        {comboBox.call(this, 'choices', this.props.choices)}
      </div>
    );
  }
});


var Scores = React.createClass({
  render: function () {
    return (
      <div className="score">
        <span className="good">{this.props.score}</span>
        <span className="bad">{this.props.total - this.props.score}</span>
      </div>
    );
  }
});


var GameApp = React.createClass({
  getInitialState: function() {
    return {
      // Player.
      feedback: 'loading',
      level: null,
      score: 0,
      total: 0,
      // Filters.
      difficulties: [],
      categories: [],
      classes: [],
      // Apparence.
      font: null,
      lettercase: null,
      choices: DEFAULT_CHOICES,
    };
  },

  componentWillMount: function () {
    // Bind store events.
    this.props.store.on('loaded', this.onLoaded.bind(this));
    this.props.store.on('next', this.onNext.bind(this));
  },

  componentDidMount: function () {
    this.animate();
  },

  /**
   * When settings are changed.
   * Called from ``GamesControl`` component.
   *
   * @param {Object} config - full configuration object.
   */
  onConfigure: function (config) {
    // Update game with new config (reset).
    console.log('Configuration is now', config);
    this.setState(_.extend(this.getInitialState(), {
      font: config.font,
      lettercase: config.lettercase,
      choices: config.choices || this.state.choices,
    }));

    // Filter with chosen config
    var filters = _.omit(config, 'font', 'lettercase', 'choices');
    if (filters) {
      this.props.store.load(filters);
    }
  },

  onLoaded: function (facets) {
    console.log('Data was loaded', facets);
    this.setState({
      difficulties: facets.difficulties,
      categories: facets.categories,
      classes: facets.classes,
      score: -1,
    });
    // (re)Start game with new score and level.
    return this.props.store.next(this.state.choices);
  },

  onNext: function (level) {
    // Use random font or lettercase if not set.
    var font = this.state.font || _.sample(this.props.fonts);
    var lettercase = this.state.lettercase || _.sample(this.props.lettercases);

    // Increase number of success.
    this.setState({
      feedback: '',
      level: level,
      score: this.state.score + 1,

      font: font,
      lettercase: lettercase,
    });
  },

  /**
   * When player picks a word.
   * Called from ``WordsCloud`` component.
   * Increase number of guesses, and if success, animate to next level.
   */
  onPlay: function (word) {
    var current = this.state.level;
    var success = word == current.word;

    // Show success/failure screen.
    this.setState({
      total: this.state.total + 1,
      feedback: success ? 'good' : 'bad'
    });

    // Animation to next level.
    var component = this.getDOMNode();
    Velocity(component,'transition.slideDownIn', {display: 'flex'})
      .then(function() {
        this.setState({feedback: ''});

        if (success) {
          // Jump to next level.
          this.props.store.next(this.state.choices);
          this.animate();
        }
        else {
          // Remove played word from choices.
          var propositions = current.words.filter(function (w) {return w != word });
          var level = _.extend(current, {words: propositions});
          this.setState({level: level})
        }
      }.bind(this));
  },

  animate: function () {
    var component = this.getDOMNode();
    var player = component.querySelectorAll('.player');
    var words = component.querySelectorAll('.words');
    Velocity(player, 'transition.bounceLeftIn');
    Velocity(words, 'transition.bounceRightIn');
  },

  render: function() {
    return (
      <div className={'main feedback feedback-' + this.state.feedback}>
        <header>
          <Scores score={this.state.score}
                  total={this.state.total} />
        </header>

        <section className="content">
          <VideoPlayer video={this.state.feedback ? {} : this.state.level.video} />
          <WordsCloud font={this.state.font}
                      lettercase={this.state.lettercase}
                      level={this.state.level || {}}
                      onPlay={this.onPlay} />
        </section>

        <GameControls onConfigure={this.onConfigure}

                      langs={this.props.langs}
                      difficulties={this.state.difficulties}
                      categories={this.state.categories}
                      classes={this.state.classes}

                      fonts={this.props.fonts}
                      lettercases={this.props.lettercases}
                      choices={this.props.choices} />
      </div>
    );
  }
});


var game = <GameApp store={new Store()}
                    langs={['fr', 'en', 'es']}
                    fonts={['hand', 'machine', 'gothic', 'script', 'sans', 'serif']}
                    lettercases={['lower', 'first', 'upper']}
                    choices={_.range(2, 8)} />
React.renderComponent(game, document.getElementById('container'));
