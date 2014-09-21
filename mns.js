/** @jsx React.DOM */
function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}

var MNS = React.createClass({

  getInitialState: function () {
    return {
      packages: {},
      name: '',
      timeScale: 'last-month'
    };
  },

  handlePackageNameChange: function (e) {
    this.setState({ name: e.target.value });
  },

  setTimeScale: function (e) {
    this.setState({ timeScale: e.target.value });
  },

  addPackage: function (e) {
    if (typeof e.keyCode !== 'undefined' && e.keyCode !== 13) return;
    var packages = this.state.packages;
    packages[this.state.name] = 0;
    this.setState({ packages: packages, name: '' });
  },

  removePackage: function (pack, e) {
    var packages = this.state.packages;
    delete packages[pack];
    this.setState({ packages: packages });
  },

  clearPackages: function () {
    this.setState({ packages: {} });
  },

  fetchStats: function () {
    Object.keys(this.state.packages).forEach(function (pack) {

      var self = this;
      var url = 'https://api.npmjs.org/downloads/point/' + this.state.timeScale + '/' + pack;
      var req = new XMLHttpRequest();

      req.open('GET', url, true);

      req.onload = function () {
        var packages = self.state.packages;
        packages[pack] = JSON.parse(req.responseText).downloads;
        self.setState({ packages: packages });
      };

      req.onerror = function () {
        console.error('Error fetching data from npm.');
      };

      req.send();
    }.bind(this));
  },

  render: function () {

    var packageKeys = Object.keys(this.state.packages);
    var packages = this.state.packages;

    var cellStyle = {
      'text-align': 'right'
    };

    var createTimeScaleOptions = ['last-month', 'last-week', 'last-day'].map(function (option, index) {
      var label = option.split('-')[1];
      label = label.charAt(0).toUpperCase() + label.slice(1);
      return <option key={ index } value={ option }>{ label }</option>;
    });

    var createPackageListItem = (function (pack, index) {
      return <li key={ index }>{ pack } <a href='#' onClick={ this.removePackage.bind(this, pack) }>&#x2716;</a></li>;
    }).bind(this);

    var createPackageTableItem = (function (pack, index) {
      var downloads = packages[pack];
      return <tr key={ index }><td>{ pack }</td><td style={ cellStyle }>{ downloads }</td></tr>;
    }).bind(this);

    var getDownloads = (function (key) {
      var downloads = packages[key];
      return downloads;
    }).bind(this);

    var sum = function (fold, next) {
      return fold + next;
    };

    return (
      <div>
        <h1>mynpmstats</h1>
        <p><small>{ supportsLocalStorage ? 'You\'re in luck, your browser supports local storage! :)' : 'Warning: your browser does not support local storage. :(' }</small></p>
        <input onChange={ this.handlePackageNameChange } value={ this.state.name } onKeyUp={ this.addPackage } placeholder='Package name...'/>
        <button onClick={ this.addPackage }>Add +</button>
        <hr/>
        <h2>manage packages</h2>
        { packageKeys.length !== 0 ? <a href='#' onClick={ this.clearPackages }>remove all &#x2716;</a> : '' }
        <ul>
          { packageKeys.length !== 0 ? packageKeys.map(createPackageListItem) : <li>No packages added. Add some old sport.</li> }
        </ul>
        <hr/>
        <h2>see stats results</h2>
        <p>Time scale
          <select onChange={ this.setTimeScale } value={ this.state.timeScale }>
            { createTimeScaleOptions }
          </select>
        </p>
        <a href='#' onClick={ this.fetchStats }>fetch &#10153;</a>
        <table>
          <tr>
            <th>Package</th>
            <th>Downloads</th>
          </tr>
          { packageKeys.map(createPackageTableItem) }
          <tfoot>
            <tr>
              <td><b>TOTAL</b></td>
              <td style={ cellStyle }>{ packageKeys.map(getDownloads).reduce(sum, 0) }</td>
            </tr>
          </tfoot>
        </table>
        <footer>
          <br/>
          <small>Another useless/silly thing built with &hearts; by <a href='http://www.twitter.com/waltfy'>waltfy</a></small>
        </footer>
      </div>
    );
  }
});

React.renderComponent(<MNS />, window.mns);