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
  render: function() {
    var onPlay = this.props.onPlay;
    var wordButton = function(word) {
      return <div className="button" onClick={onPlay.bind(null, word)}>{word}</div>;
    };
    return <div className="words col">{this.props.words.map(wordButton)}</div>;
  }
});


var GameLevel = React.createClass({
  onPlay: function (word) {
    if (word == this.props.level.word) {
      alert('Yeah!');
    }
  },

  render: function() {
    return <div className="content row">
      <VideoPlayer video={this.props.level.video}/>
      <WordsCloud words={this.props.level.words} onPlay={this.onPlay}/>
    </div>;
  }
});


var GameControls = React.createClass({
  render: function() {
    return <div className="row controls">
      <div className="col">Guess signs</div>
      <div className="col lang">
        <select name="lang">
            <option>LSF</option>
        </select>
      </div>
      <div className="col difficulty">
        <select name="lang">
            <option>Easy</option>
        </select>
      </div>
      <div className="score col">10/20</div>
  </div>;
  }
});


var GameApp = React.createClass({
  render: function() {
    var currentLevel = levels[0];
    return <div>
      <GameControls />
      <GameLevel level={currentLevel}/>
    </div>;
  }
});


React.renderComponent(<GameApp />, document.getElementById('container'));
