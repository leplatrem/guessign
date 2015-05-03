/** @jsx React.DOM */

var DEFAULT_CHOICES = 5;


var VideoPlayer = React.createClass({
  render: function() {
    return <div className="player">
      <video src={this.props.video.url} autoPlay controls></video>
      <div className="attributions">&copy; {this.props.video.attributions}</div>
    </div>;
  }
});


var WordsCloud = React.createClass({
  onWordClick: function (word) {
    var success = word == this.props.level.word;
    this.props.onPlay(success);
  },

  render: function() {
    var wordButton = function(word, i) {
      var font = this.props.font;
      var lettercase = this.props.lettercase;

      var onWordClick = this.onWordClick.bind(this, word);

      return <div key={i}
        className={'button font--' + font + ' case--' + lettercase}
        onClick={onWordClick}>{word}</div>;
    };

    return <div className="guess">
      <div className="words">
        {this.props.words.map(wordButton.bind(this))}
      </div>
    </div>;
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
    if (event.target.value) {
      this.state.config[event.target.name] = event.target.value;
    }
    else {
      delete this.state.config[event.target.name];
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
          {options.map(function (option) {
            return <option key={option} value={option}>{i18n.tr(option)}</option>
          })}
        </select>
      </div>
    }

    return <div className="controls">
      {comboBox.call(this, 'lang', this.props.langs)}
      {comboBox.call(this, 'difficulty', this.props.difficulties)}
      {comboBox.call(this, 'category', this.props.categories)}
      {comboBox.call(this, 'font', this.props.fonts)}
      {comboBox.call(this, 'lettercase', this.props.lettercases)}
      {comboBox.call(this, 'choices', this.props.choices)}
  </div>;
  }
});


var Scores = React.createClass({
  render: function () {
    return <div className="score">
      <span className="good">{this.props.score}</span>
      <span className="bad">{this.props.total - this.props.score}</span>
    </div>
  }
});


var GameApp = React.createClass({
  getInitialState: function() {
    return {
      config: {},
      score: 0,
      total: 0,
      feedback: ''
    };
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
    // Filter levels from current config.
    var filters = _.omit(config, 'font', 'lettercase', 'choices');
    this.props.store.setFilters(filters);

    // Update game with new config.
    var newstate = _.extend(this.getInitialState(), {
      config: config,
      choices: config.choices || DEFAULT_CHOICES,
      font: config.font || _.sample(this.props.fonts),
      lettercase: config.lettercase || _.sample(this.props.lettercases),
    });
    this.setState(newstate);
  },

  /**
   * When player picks a word.
   * Called from ``WordsCloud`` component.
   * Increase number of guesses, and if success, animate to next level.
   *
   * @param {bool} success - true if guessed correctly.
   */
  onPlay: function (success) {
    this.setState({
      total: this.state.total + 1,
      feedback: success ? 'good' : 'bad'
    });

    var component = this.getDOMNode();
    Velocity(component,'transition.slideDownIn')
      .then(function() {
        this.setState({feedback: ''});

        if (success) {
          this.jumpNextLevel();
        }
      }.bind(this));
  },

  jumpNextLevel: function () {
    // Jump to next level.
    this.props.store.pickNext();

    // Use random font or lettercase if not set.
    var config = this.state.config;
    var font = config.font || _.sample(this.props.fonts);
    var lettercase = config.lettercase || _.sample(this.props.lettercases);

    // Increase number of success.
    this.setState({
      score: this.state.score + 1,
      font: font,
      lettercase: lettercase,
    });

    this.animate();
  },

  animate: function () {
    var component = this.getDOMNode();
    var player = component.querySelectorAll('.player');
    var words = component.querySelectorAll('.words');
    Velocity(player,'transition.bounceLeftIn');
    Velocity(words,'transition.bounceRightIn');
  },

  render: function() {
    var store = this.props.store;
    var level = store.getCurrent();
    var words = store.getSampleWords(this.state.choices);

    return <div className={'main feedback feedback-' + this.state.feedback}>
      <header>
        <Scores score={this.state.score}
                total={this.state.total} />
      </header>

      <section className="content">
        <VideoPlayer video={this.state.feedback ? {} : level.video} />
        <WordsCloud font={this.state.font}
                    lettercase={this.state.lettercase}
                    level={level}
                    words={words}
                    onPlay={this.onPlay} />
      </section>

      <GameControls onConfigure={this.onConfigure}
                    langs={store.facetList('lang', true)}
                    difficulties={store.facetList('difficulty')}
                    categories={store.facetList('category')}
                    fonts={this.props.fonts}
                    lettercases={this.props.lettercases}
                    choices={this.props.choices} />
    </div>;
  }
});


var game = <GameApp store={new Store()}
                    fonts={['hand', 'machine', 'gothic', 'script', 'sans', 'serif']}
                    lettercases={['lower', 'first', 'upper']}
                    choices={_.range(2, 8)} />
React.renderComponent(game, document.getElementById('container'));
