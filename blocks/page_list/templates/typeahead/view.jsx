// TODO: get browserify-shim working and `React = require('react');`
document.addEventListener('DOMContentLoaded', function() {
  var PageListTypeahead = React.createClass({
    getInitialState: function() {
      return {
        q: '',
        matched: this.props.countries
      };
    },

    /**
     * _convertAccents
     * 
     * @protected
     * @param     String str
     * @return    String
     */
    convertAccents: function(str) {
      return str.replace(
        /([àáâãäå])|([ç])|([èéêë])|([ìíîï])|([ñ])|([òóôõöø])|([ß])|([ùúûü])|([ÿ])|([æ])/g,
        function(str,a,c,e,i,n,o,s,u,y,ae) {
          if(a) return 'a';
          else if(c) return 'c';
          else if(e) return 'e';
          else if(i) return 'i';
          else if(n) return 'n';
          else if(o) return 'o';
          else if(s) return 's';
          else if(u) return 'u';
          else if(y) return 'y';
          else if(ae) return 'ae';
        }
      );
    },

    strContains: function(a, b) {
      return (
        this.convertAccents(a.toLowerCase()).indexOf(
          this.convertAccents(b.toLowerCase())
        ) > -1
      );
    },

    handleInput: function(ev) {
      var _this = this;
      var countries = {}; 

      for (var i in this.props.countries) {
        var country = this.props.countries[i];
        var cities = [];
        country.cities.forEach(function(city) {
          if (!_this.state.q || _this.strContains(city.name, _this.state.q)) {
            cities.push(city);
          }
        });
        if (cities.length) {
          countries[i] = Object.assign({}, country, {cities: cities});
        }
      }

      this.setState({q: ev.target.value, matched: countries});
    },

    handleSubmit: function(ev) {
      var firstCountry = Object.keys(this.state.matched).shift();
      var firstCity;

      if (firstCountry) {
        firstCity = this.state.matched[firstCountry].shift();
        if (firstCity) {
          ev.target.action = firstCity.url;
        }
      }
    },

    render: function() {
      var _this = this;
      var homeCity = <h3 />;

      if (this.props.user && this.props.user.city) {
        homeCity = <h3>See walks in <a href={this.props.user.city.url}>{this.props.user.city.name}</a>, or:</h3>
      }

      return (
        <div className="ccm-page-list-typeahead">
          {homeCity}
          <form onSubmit={this.handleSubmit}>
            <fieldset className="search">
              <input type="text" name="selected_option" className="typeahead" placeholder="Start typing a city" autoComplete="off" value={this.state.q} onChange={this.handleInput} />
              <button type="submit">Go</button>
              <ul>
                {Object.keys(this.state.matched).map(function(key) {
                  return (
                    <li key={'country' + key} className="country">
                      <a href={_this.state.matched[key].url}>{_this.state.matched[key].name}</a>
                      <ul className="cities">
                        {_this.state.matched[key].cities.map(function(city) {
                          return (
                            <li key={'city' + city.id}>
                              <a href={city.url}>{city.name}</a>
                            </li>
                            )
                        })}
                      </ul>
                    </li>
                    );
                })}
                {Object.keys(this.state.matched).length === 0 ?
                  <li><a href="/city-organizer-onboarding">{'Add ' + _this.state.q + ' to Jane\'s Walk'}</a></li> :
                  null
                }
              </ul>
            </fieldset>
          </form>
        </div>
      );
    }
  });

  React.render(
    <PageListTypeahead countries={JanesWalk.countries} user={JanesWalk.user} />,
    document.getElementById('ccm-jw-page-list-typeahead')
  );
});
