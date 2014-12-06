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
    var state = {};

    // Detect language from browser
    if (this.props.langs.indexOf(navigator.language) >= 0) {
      state.lang = navigator.language;
    }
    var short = navigator.language.split('-')[0];
    if (this.props.langs.indexOf(short) >= 0) {
      state.lang = short;
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
      total: 0
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

  onPlay: function (success) {
    if (success) {
      var next = (this.state.current + 1) % this.state.levels.length;
      this.setState({
        score: this.state.score + 1,
        current: next
      });
    }
    this.setState({total: this.state.total + 1});
  },

  render: function() {
    var level = this.state.levels[this.state.current];
    var words = level.words;

    return <div>
      <header>
        <Scores score={this.state.score}
                total={this.state.total} />
      </header>

      <section className="content">
        <VideoPlayer video={level.video} />
        <WordsCloud level={level}
                    words={words}
                    onPlay={this.onPlay} />
      </section>

      <footer>
        <GameControls onConfigure={this.onConfigure}
                      langs={this.facetList('lang', true)}
                      difficulties={this.facetList('difficulty')}
                      categories={this.facetList('category')} />
      </footer>
    </div>;
  }
});


React.renderComponent(<GameApp database={levels} />, document.getElementById('container'));
