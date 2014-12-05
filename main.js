/** @jsx React.DOM */

var VideoPlayer = React.createClass({
  render: function() {
    return <div className="player col">
      <video src={this.props.video.url} autoPlay controls></video>
      <div className="attributions">&copy; {this.props.video.attributions}</div>
    </div>;
  }
});


var WordsCloud = React.createClass({
  onWordClick: function (word) {
    var success = word == this.props.word;
    this.props.onPlay(success);
  },

  render: function() {
    var wordButton = function(word) {
      var onWordClick = this.onWordClick.bind(this, word);
      return <div className="button"
                  key={word}
                  onClick={onWordClick}>{word}</div>;
    };

    var words = this.props.words;
    return <div className="words col">
      {words.map(wordButton.bind(this))}
    </div>;
  }
});


var GameControls = React.createClass({
  componentDidMount: function() {
    this.config = {};
  },

  onChange: function (event) {
    this.config[event.target.name] = event.target.value;
    this.props.onConfigure(this.config);
  },

  render: function() {

    var comboBox = function (property, options) {
      return <div className="col {property}">
        <select name={property} onChange={this.onChange}>
          <option value="">Choose {property}...</option>
          {options.map(function (option) {
            return <option key={option} value={option}>{option}</option>
          })}
        </select>
      </div>
    }

    return <div className="row controls">
      <div className="col">Guessing signs</div>
      {comboBox.call(this, 'lang', this.props.langs)}
      {comboBox.call(this, 'difficulty', this.props.difficulties)}
      {comboBox.call(this, 'category', this.props.categories)}
      <div className="score col">{this.props.score}/{this.props.total}</div>
  </div>;
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

  getFilters: function () {
    var filters = {
      lang: this.state.lang,
      difficulty: this.state.difficulty,
      category: this.state.category
    };
    for(var k in filters)
      if(!filters[k]) delete filters[k];
    return filters;
  },

  onConfigure: function (config) {
    var newstate = _.extend(this.getInitialState(), config);
    this.setState(newstate);
    var matching = _.where(this.props.database, this.getFilters());
    this.setState({levels: matching});
  },

  facetList: function (property) {
    var filters = this.getFilters();
    delete filters[property];
    var matching = _.where(this.props.database, filters);
    var facets = _.pluck(matching, property);
    return _.uniq(facets.sort(), true);
  },

  onPlay: function (success) {
    var score = this.state.score;
    var next = this.state.current;

    // Jump to next level if correct
    if (success) {
      score++;
      next = ++next % this.state.levels.length;
    }

    this.setState({
      current: next,
      score: score,
      total: this.state.total + 1
    });
  },

  render: function() {
    var level = this.state.levels[this.state.current];
    return <div>
      <GameControls onConfigure={this.onConfigure}
                    langs={this.facetList('lang')}
                    difficulties={this.facetList('difficulty')}
                    categories={this.facetList('category')}
                    score={this.state.score}
                    total={this.state.total} />
      <div className="content row">
        <VideoPlayer video={level.video} />
        <WordsCloud word={level.word}
                    words={level.words}
                    onPlay={this.onPlay} />
      </div>
    </div>;
  }
});


React.renderComponent(<GameApp database={levels} />, document.getElementById('container'));
