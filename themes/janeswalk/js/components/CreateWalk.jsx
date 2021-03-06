'use strict';
// Create a Walk
// 
// Form for creating new walks. Includes a map builder, team builder, scheduler
//

// Load create-a-walk View components
var ImageUpload = require('./caw/ImageUpload.jsx');
var ThemeSelect = require('./caw/ThemeSelect.jsx');
var MapBuilder = require('./caw/MapBuilder.jsx');
var DateSelect = require('./caw/DateSelect.jsx');
var WardSelect = require('./caw/WardSelect.jsx');
var AccessibleSelect = require('./caw/AccessibleSelect.jsx');
var TeamBuilder = require('./caw/TeamBuilder.jsx');
var WalkPublish = require('./caw/WalkPublish.jsx');
var TextAreaLimit = require('./TextAreaLimit.jsx');

// Flux
var I18nStore = require('../stores/I18nStore.js');
var t = I18nStore.getTranslate();
var t2 = I18nStore.getTranslatePlural();
var I18nActions = require('../actions/I18nActions.js');

// Helpers
var Helper = require('../helpers/helpers.jsx');

var CreateWalk = React.createClass({
  mixins: [React.addons.LinkedStateMixin],

  getInitialState: function() {
    var data = this.props.data;
    // TODO: move this into its own model js
    // Keep these defaults to type, ie don't pre-seed data here, aside from
    // data loaded by passing it in
    var walk = {
      name: '',
      shortDescription: '',
      longDescription: '',
      accessibleInfo: '',
      accessibleTransit: '',
      accessibleParking: '',
      accessibleFind: '',
      map: {
        markers: [],
        route: []
      },
      team: [{
        id: -1,
        type: 'you',
        "name-first": '',
        "name-last": '',
        role: 'walk-leader',
        primary: 'on',
        bio: '',
        twitter: '',
        facebook: '',
        website: '',
        email: '',
        phone: ''
      }],
      time: {type: '', slots: []},
      thumbnails: [],
      wards: '',
      checkboxes: {},
      notifications: [],
      mirrors: {},
      url: this.props.url
    };

    // Convert old {0: marker, 1: marker} indexing to a proper array
    if (data) {
      // Convert markers
      if (data.map && !Array.isArray(data.map.markers)) {
        data.map.markers = Helper.objectToArray(data.map.markers);
      }
      // Convert routes
      if (data.map && !Array.isArray(data.map.route)) {
        data.map.route = Helper.objectToArray(data.map.route);
      }
      // Convert time slots
      if (data.time && !Array.isArray(data.time.slots)) {
        data.time.slots = Helper.objectToArray(data.time.slots);
      }
      // Turn all 'false' values into empty strings
      for (var i in data) {
        if (data[i] === false) {
          data[i] = '';
        } else if (data[i] === null) {
          // Clear out 'nulls' so we instead take their state from defaults
          delete data[i];
        }
      }

      // Init the leader as creator, if none set
      data.team = data.team || []
      if (data.team.length === 0) {
        var user = this.props.user;
        data.team = [{
          type: 'you',
          "name-first": user.firstName,
          "name-last": user.lastName,
          role: 'walk-leader',
          primary: 'on',
          bio: user.bio,
          twitter: user.twitter,
          facebook: user.facebook,
          website: user.website,
          email: user.email,
          phone: '' 
        }];
      }
      Object.assign(walk, data);
    }
    return walk;
  },

  saveWalk: function(options, cb) {
    // TODO: separate the notifications logic
    /* Send in the updated walk to save, but keep working */
    var notifications = this.state.notifications.slice();
    var removeNotice = function() {
      var notifications = this.state.notifications.slice();
      this.setState({notifications: notifications.slice(1)});
    }.bind(this);

    var defaultOptions = {
      messageTimeout: 1200
    };
    options = options || {};

    notifications.push({type: 'info', name: 'Saving walk'});

    // Build a simplified map from the Google objects
    this.setState({
      map: this.refs.mapBuilder.getStateSimple(),
      notifications: notifications
    }, function() {
      $.ajax({
        url: this.state.url,
        type: options.publish ? 'PUT' : 'POST',
        data: {json: JSON.stringify(this.state)},
        dataType: 'json',
        success: function(data) {
          var notifications = this.state.notifications.slice();
          notifications.push({type: 'success', name: 'Walk saved'});
          this.setState(
            {notifications: notifications, url: (data.url || this.state.url)},
            function() {
              if (cb && cb instanceof Function) {
                // The 'this' in each callback should be the <CreateWalk>
                cb.call(this);
              }
            }
          );
          setTimeout(removeNotice, 1200);
          }.bind(this),
        error: function(xhr, status, err) {
          var notifications = this.state.notifications.slice();
          notifications.push({type: 'danger', name: 'Walk failed to save', message: 'Keep this window open and contact Jane\'s Walk for assistance'});
          this.setState({notifications: notifications});
          setTimeout(removeNotice, 6000);
          console.error(this.url, status, err.toString());
        }.bind(this)
      });
    }.bind(this));
    setTimeout(removeNotice, 1200);
  },

  handleNext: function() {
    // Bootstrap's managing the tabs, so trigger a jQuery click on the next
    var next = $('#progress-panel > .nav > li.active + li > a');
    window.scrollTo(0, 0);
    if (next.length) {
      this.saveWalk();
      next.trigger('click');
    } else {
      // If no 'next' tab, next step is to publish
      $(this.refs.publish.getDOMNode()).trigger('click');
    }
  },
 
  handleSave: function() {
    this.saveWalk();
  },

  handlePublish: function() {
    this.saveWalk({publish: true}, function() {
      console.log('Walk published');
    });
  },
 
  handlePreview: function(e) {
    var _this = this;
    this.saveWalk({}, function() {
      _this.setState({preview: true});
    });
  },

  componentWillMount: function() {
    I18nStore.addChangeListener(this._onChange.bind(this));
  },

  componentWillUnmount: function() {
    I18nStore.removeChangeListener(this._onChange.bind(this));
  },

  // Simple trigger to re-render the components
  _onChange: function() {
    this.setState({});
  },

  render: function() {
    // Used to let the map pass a callback
    var linkStateMap = {
      value: this.state.map,
      requestChange: function(newVal, cb) {
        this.setState({map: newVal}, cb);
      }.bind(this)
    };

    return (
      <main id="create-walk">
        <section>
          <nav id="progress-panel">
            <ul className="nav nav-tabs">
              <li className="active"><a data-toggle="tab" className="description" href="#description"><i className="fa fa-list-ol" />{ t('Describe Your Walk') }</a></li>
              <li><a data-toggle="tab" className="route" href="#route"><i className="fa fa-map-marker" />{ t('Share Your Route') }</a></li>
              <li><a data-toggle="tab" className="time-and-date" href="#time-and-date"><i className="fa fa-calendar" />{ t('Set the Time & Date') }</a></li>
              <li><a data-toggle="tab" className="accessibility" href="#accessibility"><i className="fa fa-flag" />{ t('Make it Accessible') }</a></li>
              <li><a data-toggle="tab" className="team" href="#team"><i className="fa fa-users" />{ t('Build Your Team') }</a></li>
            </ul>
            <section id="button-group">
              <button className="btn btn-info btn-preview" id="preview-walk" title="Preview what you have so far." onClick={this.handlePreview}>{ t('Preview Walk') }</button>
              <button className="btn btn-info btn-submit" id="btn-submit" title="Publishing will make your visible to all." onClick={function() {this.setState({publish: true})}.bind(this)} ref="publish">{ t('Publish Walk') }</button>
              <button className="btn btn-info save" title="Save" id="btn-save" onClick={this.handleSave}>{ t('Save') }</button>
            </section>
          </nav>
          <div id="main-panel" role="main">
            <div className="tab-content">
              <div className="tab-pane active" id="description">
                <div className="walk-submit lead clearfix">
                  <div className="col-md-4">
                    <img id="convo-marker" src={CCM_THEME_PATH + '/img/jw-intro-graphic.svg'} alt="Jane's Walks are walking conversations." />
                  </div>
                  <div className="col-md-8">
                    <h1>{ t('Hey there, %s!', this.props.user.firstName) }</h1>
                    <p>{ t('Jane’s Walks are walking conversations about neighbourhoods. You can return to this form at any time, so there\'s no need to finish everything at once.') }</p>
                  </div>
                </div>
                <div className="page-header" data-section='description'>
                  <h1>{ t('Describe Your Walk') }</h1>
                </div>
                <form>
                  <fieldset>
                    <div className="item required">
                      <label htmlFor="title">{ t('Walk Title') }</label>
                      <div className="alert alert-info">{ t('Something short and memorable.') }</div>
                      <input type="text" valueLink={this.linkState('title')} />
                    </div>
                  </fieldset>
                </form>
                <ImageUpload valueLink={this.linkState('thumbnails')} valt={this.props.valt} />
                <form>
                  <hr />
                  <fieldset>
                    <div className="item required">
                      <label htmlFor="shortdescription">{ t('Your Walk in a Nutshell') }</label>
                      <div className="alert alert-info">{ t('Build intrigue! This is what people see when browsing our walk listings.') }</div>
                      <TextAreaLimit id="shortdescription" name="shortdescription" rows="6" maxLength="140" valueLink={this.linkState('shortDescription')} required />
                    </div>
                    <hr />
                    <div className="item required">
                      <label htmlFor="longdescription" id="longwalkdescription">{ t('Walk Description') }</label>
                      <div className="alert alert-info">
                        {t('Help jump start the conversation on your walk by giving readers an idea of the discussions you\'ll be having on the walk together. We suggest including a couple of questions to get people thinking about how they can contribute to the dialog on the walk. To keep this engaging, we recommend keeping your description to 200 words.')} 
                      </div>
                      <textarea id="longdescription" name="longdescription" rows="14" valueLink={this.linkState('longDescription')} />
                    </div>
                  </fieldset>
                  <ThemeSelect valueLink={this.linkState('checkboxes')} />
                  {((this.props.city.wards || []).length > 0) ? <WardSelect wards={this.props.city.wards} valueLink={this.linkState('wards')} /> : null}
                  <hr />
                </form>
              </div>
              <MapBuilder ref="mapBuilder" valueLink={linkStateMap} city={this.props.city} />
              <DateSelect valueLink={this.linkState('time')} />
              <div className="tab-pane" id="accessibility">
                <div className="page-header" data-section='accessibility'>
                  <h1>{ t('Make it Accessible') }</h1>
                </div>
                <div className="item">
                  <AccessibleSelect valueLink={this.linkState('checkboxes')} />
                </div>

                <div className="item">
                  <fieldset>
                    <legend>{ t('What else do people need to know about the accessibility of this walk?') } ({ t('Optional') })</legend>
                    <TextAreaLimit name="accessible-info" rows="3" maxLength="500" valueLink={this.linkState('accessibleInfo')} />
                  </fieldset>
                </div>

                <div className="item">
                  <fieldset>
                    <legend id="transit">{ t('How can someone get to the meeting spot by public transit?') } ({ t('Optional') })</legend>
                    <div className="alert alert-info">
                      { t('Nearest subway stop, closest bus or streetcar lines, etc.')} 
                    </div>
                    <textarea rows="3" name="accessible-transit" valueLink={this.linkState('accessibleTransit')} />
                  </fieldset>
                </div>

                <div className="item">
                  <fieldset>
                    <legend>{ t('Where are the nearest places to park?') } ({ t('Optional') })</legend>
                    <textarea rows="3" name="accessible-parking" valueLink={this.linkState('accessibleParking')} />
                  </fieldset>
                </div>

                <div className="item">
                  <fieldset>
                    <legend className="required-legend" >{ t('How will people find you?') }</legend>
                    <div className="alert alert-info">
                      { t('Perhaps you will be holding a sign, wearing a special t-shirt or holding up an object that relates to the theme of your walk. Whatever it is, let people know how to identify you.')} 
                    </div>
                    <textarea rows="3" name="accessible-find"  valueLink={this.linkState('accessibleFind')} />
                  </fieldset>
                </div>
                <hr />
                <br />
              </div>
              <TeamBuilder valueLink={this.linkState('team')} />
            </div>
            <button type="button" onClick={this.handleNext} className="btn">Next</button>
          </div>
          <aside id="tips-panel" role="complementary">
            <div className="popover right" id="city-organizer" style={{display: 'block'}}>
              <h3 className="popover-title" data-toggle="collapse" data-target="#popover-content"><i className="fa fa-envelope" />{ t('Contact City Organizer for help') }</h3>
              <div className="popover-content collapse in" id="popover-content">
                {this.props.city.cityOrganizer.photo ? <div className='u-avatar' style={{backgroundImage: 'url(' + this.props.city.cityOrganizer.photo + ')'}} /> : null}
                <p>
                  { t('Hi! I\'m %s, the City Organizer for Jane\'s Walk %s. I\'m here to help, so if you have any questions, please', this.props.city.cityOrganizer.firstName, this.props.city.name) } <strong><a href={'mailto:' + this.props.city.cityOrganizer.email}>{ t('email me') }!</a></strong></p>
              </div>
            </div>
          </aside>
        </section>
        {this.state.publish ? <WalkPublish url={this.state.url} saveWalk={this.saveWalk.bind(this)} close={this.setState.bind(this, {publish: false})} city={this.props.city} mirrors={this.state.mirrors} /> : null}
        {this.state.preview ? <WalkPreview url={this.state.url} close={this.setState.bind(this, {preview: false})} /> : null}
        <aside id="notifications">
          {this.state.notifications.map(function(notification) {
            return (
              <div key={notification.message} className={'alert alert-' + notification.type}>
                <strong>{notification.name || ''}:&nbsp;</strong>
                {notification.message || ''}
              </div>
              );
          })}
        </aside>
      </main>
    );
  }
});

var WalkPreview = React.createClass({
  componentDidMount: function() {
    var _this = this;
    // Bootstrap Modal
    $(this.getDOMNode()).modal();
    // Close the modal when modal closes
    $(this.getDOMNode()).bind('hidden.bs.modal', function() {
      _this.props.close();
    });
  },
  render: function() {
    return (
      <dialog id="preview-modal">
        <div>
          <article>
            <header>
              <button type="button" className="close" aria-hidden="true" data-dismiss="modal">&times;</button>
              <h3>{ t('Preview of your Walk') }</h3>
            </header>
            <div className="modal-body">
              <iframe src={this.props.url} frameBorder="0" />
            </div>
          </article>
        </div>
      </dialog>
    );
  }
});

module.exports = CreateWalk;
