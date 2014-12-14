/** @jsx React.DOM */

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
      var font = _.sample(this.props.font);
      var lettercase = _.sample(this.props.lettercase);

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
      return JSON.parse(config);
    }

    var state = {};
    // Detect language from browser
    var short = navigator.language.split('-')[0];
    if (this.props.langs.indexOf(short) >= 0) {
      state.lang = short;
    }
    if (this.props.langs.indexOf(navigator.language) >= 0) {
      state.lang = navigator.language;
    }
    return state;
  },

  componentDidMount: function() {
    this.props.onConfigure(this.state);
  },

  onChange: function (event) {
    this.state[event.target.name] = event.target.value;
    // Remove empty values
    for(var k in this.state)
      if(!this.state[k]) delete this.state[k];

    // Save for next visit
    localStorage.setItem('config', JSON.stringify(this.state));

    // Notify parent
    this.props.onConfigure(this.state);
  },

  render: function() {
    var comboBox = function (property, options) {
      return <div className={'control control--' + property}>
        <select name={property}
                value={this.state[property]}
                onChange={this.onChange}>
          <option value="">Choose {property}...</option>
          {options.map(function (option) {
            return <option key={option} value={option}>{option}</option>
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
      levels: this.props.database,
      current: 0,
      score: 0,
      total: 0,
      feedback: ''
    };
  },

  onConfigure: function (config) {
    var filters = _.omit(config, 'font', 'lettercase', 'choices');
    var matching = _.where(this.props.database, filters);
    var newstate = _.extend(this.getInitialState(), {
      config: config,
      levels: _.shuffle(matching),
    });
    this.setState(newstate);
  },

  facetList: function (property, complete) {
    var list = complete ? this.props.database : this.state.levels;
    var facets = _.pluck(list, property);
    return _.uniq(facets.sort(), true);
  },

  getLevel: function () {
    return this.state.levels[this.state.current];
  },

  getSampleWords: function () {
    var level = this.getLevel();
    var words = level.words;
    var total = this.state.config.choices || 5;

    if (total > words.length) {
      var others = _.uniq(_.flatten(_.pluck(this.state.levels, 'words')));
      var extra = _.sample(_.without(others, words), total - words.length);
      words = words.concat(extra);
    }

    words.unshift(level.word);
    return _.shuffle(words.slice(0, total));
  },

  onPlay: function (success) {
    this.setState({
      total: this.state.total + 1,
      feedback: success ? 'good' : 'bad'
    });

    setTimeout(function () {
      if (success) {
        this.nextLevel();
      }
      else {
        this.setState({feedback: ''});
      }
    }.bind(this), 500);
  },

  nextLevel: function () {
    this.setState({
      feedback: '',
      score: this.state.score + 1,
      current: (this.state.current + 1) % this.state.levels.length
    });
  },

  render: function() {
    var level = this.getLevel();
    var words = this.getSampleWords();

    var config = this.state.config;
    var fonts = ['hand', 'machine', 'gothic', 'script', 'sans', 'serif'];
    var font = config.font ? [config.font] : fonts;
    var lettercases = ['lower', 'first', 'upper'];
    var lettercase = config.lettercase ? [config.lettercase] : lettercases;

    return <div className={'feedback feedback-' + this.state.feedback}>
      <header>
        <Scores score={this.state.score}
                total={this.state.total} />
      </header>

      <section className="content">
        <VideoPlayer video={this.state.feedback ? {} : level.video} />
        <WordsCloud font={font}
                    lettercase={lettercase}
                    level={level}
                    words={words}
                    onPlay={this.onPlay} />
      </section>

      <GameControls onConfigure={this.onConfigure}
                    langs={this.facetList('lang', true)}
                    difficulties={this.facetList('difficulty')}
                    categories={this.facetList('category')}
                    fonts={fonts}
                    lettercases={lettercases}
                    choices={_.range(2, 8)} />
    </div>;
  }
});


React.renderComponent(<GameApp database={levels} />, document.getElementById('container'));
