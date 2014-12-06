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
    var wordButton = function(word) {
      var font = _.sample(['hand', 'machine', 'sans', 'serif']);
      var lettercase = _.sample(['lower', 'first', 'upper']);

      var onWordClick = this.onWordClick.bind(this, word);

      return <div key={word}
        className={'button font--' + font + ' case--' + lettercase}
        onClick={onWordClick}>{word}</div>;
    };

    var words = this.props.words;
    var level = this.props.level;

    return <div className="guess">
      <div className="words">
        {words.map(wordButton.bind(this))}
      </div>
      <div className="infos">
        <div className="lang col">{level.lang}</div>
        <div className="difficulty col">{level.difficulty}</div>
        <div className="category col">{level.category}</div>
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
      levels: this.props.database,
      current: 0,
      score: 0,
      total: 0,
      feedback: ''
    };
  },

  onConfigure: function (config) {
    var matching = _.where(this.props.database, config);
    var newstate = _.extend(this.getInitialState(), {levels: matching});
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
    var basic = level.words;
    basic.push(level.word);

    var total = 6;
    var others = _.uniq(_.flatten(_.pluck(this.state.levels, 'words')));
    var extra = _.sample(others, total - basic.length);
    return _.shuffle(basic.concat(extra));
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

    return <div>
      <header>
        <Scores score={this.state.score}
                total={this.state.total} />
      </header>

      <div className={'feedback feedback-' + this.state.feedback} />

      <section className="content">
        <VideoPlayer video={level.video} />
        <WordsCloud level={level}
                    words={words}
                    onPlay={this.onPlay} />
      </section>

      <GameControls onConfigure={this.onConfigure}
                    langs={this.facetList('lang', true)}
                    difficulties={this.facetList('difficulty')}
                    categories={this.facetList('category')} />
    </div>;
  }
});


React.renderComponent(<GameApp database={levels} />, document.getElementById('container'));
