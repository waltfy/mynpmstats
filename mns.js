/** @jsx React.DOM */
var supportsLocalStorage = (function () {
  try {
    return 'localStorage' in window && window.localStorage !== null;
  } catch (e) {
    return false;
  }
}).bind(window);

var MNS = React.createClass({

  getInitialState: function () {
    return {
      packages: JSON.parse(localStorage.getItem("packages")) || {},
      fetched: [],
      name: '',
      timeScale: JSON.parse(localStorage.getItem("timeScale")) || 'last-month'
    };
  },

  persist: function () {
    if (supportsLocalStorage) {
      localStorage.setItem("packages", JSON.stringify(this.state.packages));
      localStorage.setItem("timeScale", JSON.stringify(this.state.timeScale));
    }
  },

  handlePackageNameChange: function (e) {
    this.setState({ name: e.target.value });
  },

  setTimeScale: function (e) {
    this.setState({ timeScale: e.target.value, fetched: [] }, function () {
      this.fetchStats();
      this.persist();
    }.bind(this));
  },

  addPackage: function (e) {
    if (typeof e.keyCode !== 'undefined' && e.keyCode !== 13) return;
    if (this.state.name === '') return alert('Add a package name, fool.');
    var packages = this.state.packages;
    packages[this.state.name] = 0;
    this.setState({ packages: packages, name: '' }, function () {
      this.persist();
      this.fetchStats();
    }.bind(this));
  },

  removePackage: function (pack, e) {
    var packages = this.state.packages;
    var fetched = this.state.fetched;
    delete packages[pack];
    fetched = fetched.splice(fetched.indexOf(pack), 1);
    this.setState({ packages: packages }, this.persist);
  },

  clearPackages: function () {
    this.setState({ packages: {}, fetched: [] }, this.persist);
  },

  fetchStats: function () {
    var state = this.state;
    var self = this;

    Object.keys(state.packages).forEach(function (pack) {

      var fetched = state.fetched;
      var url = 'https://api.npmjs.org/downloads/point/' + state.timeScale + '/' + pack;
      var req = new XMLHttpRequest();

      if (fetched.indexOf(pack) >= 0) return;

      req.open('GET', url, true);

      req.onload = function () {
        var packages = self.state.packages;
        packages[pack] = JSON.parse(req.responseText).downloads;
        fetched.push(pack);
        self.setState({ packages: packages,  }, self.persist);
      };

      req.onerror = function () {
        console.error('Error fetching data from npm.');
      };

      req.send();
    });
  },

  render: function () {
    var self = this;
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

    var createPackageListItem = function (pack, index) {
      return <li key={ index }>{ pack } &nbsp; <a href='#' onClick={ self.removePackage.bind(self, pack) }>&#x2716;</a></li>;
    };

    var createPackageTableItem = function (pack, index) {
      var downloads = packages[pack];
      return <tr key={ index }><td>{ pack }</td><td style={ cellStyle }>{ downloads }</td></tr>;
    };

    var getDownloads = function (key) {
      var downloads = packages[key];
      return downloads;
    };

    var sum = function (fold, next) {
      return fold + next;
    };

    return (
      <div>
        <h1>mynpmstats</h1>
        <p><small>{ supportsLocalStorage ? 'You\'re in luck, your browser supports local storage! :)' : 'Damn. Your browser does not support local storage. :(' }</small></p>
        <input onChange={ this.handlePackageNameChange } value={ this.state.name } onKeyUp={ this.addPackage } placeholder='Package name...'/>
        <button onClick={ this.addPackage }>Add +</button>
        <p><small>Add stuff. e.g. <code>async</code>, <code>request</code> or <code>chalk</code>.</small></p>
        <hr/>
        <h2>Manage Packages</h2>
        <ul>
          { packageKeys.length !== 0 ? packageKeys.map(createPackageListItem) : <li>No packages added. Add some old sport.</li> }
        </ul>
        { packageKeys.length > 1 ? <a href='#' onClick={ this.clearPackages }>remove all &#x2716;</a> : '' }
        <hr/>
        <h2>Stats</h2>
        <p>I wanna check downloads for the last &nbsp;
          <select onChange={ this.setTimeScale } value={ this.state.timeScale }>
            { createTimeScaleOptions }
          </select>
        </p>
        <table>
          <thead>
            <tr>
              <th>Package</th>
              <th>Downloads</th>
            </tr>
           </thead>
           <tfoot>
            <tr>
              <td><b>TOTAL</b></td>
              <td style={ cellStyle }><b>{ packageKeys.map(getDownloads).reduce(sum, 0) }</b></td>
            </tr>
          </tfoot>
          <tbody>
            { packageKeys.map(createPackageTableItem) }
          </tbody>
        </table>
        <br/>
        <a href='#' onClick={ this.fetchStats }>refresh &#8635;</a>
        <hr/>
        <footer>
          <br/>
          <small>Another <i>useless</i> thing built with &hearts; by <a href='http://www.twitter.com/waltfy'>waltfy</a>. Although... it needs a bit more &hearts;.</small>
        </footer>
      </div>
    );
  }
});

React.renderComponent(<MNS />, window.mns);
