/** @jsx React.DOM */

var levels = [
  {
    word: "Play",
    video: {
      url: "http://media.spreadthesign.com/video/mp4/13/49199.mp4",
      attributions: "Spreadthesign.com"
    },
    words: ["Eat", "Play", "Jump"]
  }
];


var VideoPlayer = React.createClass({
  render: function() {
    return <div className="player col">
      <video src={this.props.video.url} autoPlay controls="true"></video>
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
                  onClick={onWordClick}>{word}</div>;
    };
    return <div className="words col">
      {this.props.words.map(wordButton.bind(this))}
    </div>;
  }
});


var GameControls = React.createClass({
  render: function() {
    return <div className="row controls">
      <div className="col">Guessing signs</div>
      <div className="col lang">
        <select name="lang">
          <option value="fr">LSF (Fr)</option>
          <option value="en-US">ASL (USA)</option>
        </select>
      </div>
      <div className="col difficulty">
        <select name="difficulty">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
      </div>
      <div className="col category">
        <select name="category">
          <option>Verb</option>
          <option>Colour</option>
          <option>Music</option>
        </select>
      </div>
      <div className="score col">{this.props.score}/{this.props.total}</div>
  </div>;
  }
});


var GameApp = React.createClass({
  getInitialState: function() {
    return {
      current: 0,
      score: 0,
      total: 0
    };
  },

  onPlay: function (success) {
    var score = this.state.score;
    var next = this.state.current;

    // Jump to next level if correct
    if (success) {
      score++;
      next = ++next % this.props.database.length;
    }

    this.setState({
      current: next,
      score: score,
      total: this.state.total + 1
    });
  },

  render: function() {
    var level = this.props.database[this.state.current];
    return <div>
      <GameControls score={this.state.score}
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
