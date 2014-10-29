// New Session Popover

$.paramsURL = function(param_name){
  var value = new RegExp('[\\?&]' + param_name + '=([^&#]*)').exec(window.location.href);
  if (value !== null) {
    return value[1];
  }
};

// Time Convert
function timeConvert (time) {
  // Check correct time format and split into components
  time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

  if (time.length > 1) { // If time format correct
    time = time.slice (1);  // Remove full string match value
    time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
    time[0] = +time[0] % 12 || 12; // Adjust hours
  }
  return time.join (''); // return adjusted time or original string
}

var dateSelected = [];
window.jwMap = {}; // Not ideal, but keep for now until I can localize this.

// Typeahead team members
$.fn.teamTypeahead = function() {
  this.autocomplete({
    name: 'team-member',
    remote: { url: '/api/walk_leaders?q=%QUERY', rateLimitWait: 100 },
    valueKey: 'first_name',
    template: function(datum) {
      return "<div class='datum'>" + (datum.avatar ? "<div style='background:url(" + datum.avatar + ")'></div>  " : "") + datum.first_name + " " + datum.last_name + (datum.city_name ? ", " + datum.city_name : "") + "</div>";
    },
  }).on('typeahead:selected', function (object, datum) {
    var teamMember = $(this).parents(".team-member").first();
    $('input[name=user_id\\[\\]]', teamMember).val(datum.user_id);
    if(!datum.last_name) {
      var twoNames = teamMember.first_name.split(' ');
      $('input[name=name-first\\[\\]]', teamMember).val(twoNames[0]);
      $('input[name=name-last\\[\\]]', teamMember).val(twoNames[1]);
    } else {
      $('input[name=name-first\\[\\]]', teamMember).val(datum.first_name);
      $('input[name=name-last\\[\\]]', teamMember).val(datum.last_name);
    }
    if(datum.facebook)
      $('#facebook', teamMember).val(datum.facebook);
    if(datum.twitter)
      $('input[name=twitter\\[\\]]', teamMember).val(datum.twitter);
    if(datum.website)
      $('input[name=website\\[\\]]', teamMember).val(datum.website);
    if(datum.bio)
      $('textarea[name=bio\\[\\]]', teamMember).text(datum.bio);
  });
};

window.Janeswalk = {
  initialize: function() {
    // Append html
    if ($('body').hasClass('index')) {
      $('html').addClass('index-bg');
    }

    // Date Picker

    var defaultDate = JanesWalk.form.datepicker_cfg.defaultDate;

    // Defaults
    JanesWalk.form.datepicker_cfg.beforeShowDay =
      function (date) {
        var date_utc = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        var dateFormatted = date.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric'});
        if ($.inArray(dateFormatted, dateSelected) != -1) {
          return [
            true, // disabled
            'selected' // classes
          ];
        }
        return [true, ''];
      };
    JanesWalk.form.datepicker_cfg.minDate = new Date();
    JanesWalk.form.datepicker_cfg.maxDate = new Date("May 23, 2020");
    JanesWalk.form.datepicker_cfg.defaultDate = new Date();



    // Note: $.datepicker.formatDate( "MM d, yy", defaultDate); also works.
    // Avoid including whole libs for one-offs, e.g. moment()
    $('.date-indicate-all, .date-indicate-set').
      html(defaultDate.toLocaleString('en-US', {year: "numeric", month: "long", day: "numeric"})).
      attr('data-dateselected', defaultDate);

    $('.date-picker').datepicker(JanesWalk.form.datepicker_cfg).on('changeDate', function(e){
      $('#walk-time').timepicker('remove');
      dateObject = moment(e.date).format('MMMM D, YYYY');
      dateObjectFormatted = moment(e.date).format('YYYY-MM-DD');
      $('.date-indicate-all, .date-indicate-set').html(dateObject).attr('data-dateselected',dateObjectFormatted);
      // Special-case any dates that are set
      // TODO: move to a consistent datetimepicker, or at least not bootstrap datepicker + jquery timepicker
      if (JanesWalk.form[dateObjectFormatted] !== undefined) {
        $('#walk-time').timepicker(JanesWalk.form[dateObjectFormatted].timepicker_cfg);
      } else if (typeof JanesWalk.form.timepicker_cfg !== 'undefined') {
        $('#walk-time').timepicker(JanesWalk.form.timepicker_cfg);
      }
    });

    $('#save-date-set').on('click', function(){
      var selectedDate = $('.date-indicate-set').text();
      var selectedTime = timeConvert($('#walk-time').val());
      var selectedDuration = $('#time-and-date-set #walk-duration').val();
      addDateSet(selectedDate, selectedDuration, selectedTime);
    });

    $('#save-date-all').on('click', function(){
      var selectedDate = $('.date-indicate-all').text();
      var selectedDuration = $('#time-and-date-all #walk-duration').val();
      var selectedDateFormatted = $('.date-indicate-all').attr('data-dateselected');
      addDateAll(selectedDate, selectedDuration, selectedDateFormatted);
      
      // Disable date in calendar widget
      dateSelected.push(selectedDateFormatted);

    });

    // Clear on switch over
    $('.clear-date').on('click', function(){
      dateSelected = [];
      $('#block-select li').removeClass('active');
      $('#date-list-all tbody, #date-list-set tbody').html('');
      $('.date-picker').datepicker('update');
    });

    $('#date-list-all tbody, #date-list-set tbody').on('click', '#remove-date', function(event){
      $(this).parentsUntil('tbody').remove();
      for (var i = 0; i < dateSelected.length; i++) {
        if (dateSelected[i] === $(this).data('datedelete')) {
          dateSelected.splice(i);
        }
      }
      return false;
    });

    // Only allow duration set 
    // $('[type="checkbox"][name="open"]').on('click', function(){
    //   if ($(this).)
    // });

    $('[type="checkbox"][name="open"]').change(function(){
      if ($(this).prop('checked') === true) {
        console.log('adad');
        $('#time-and-date-all .date-select-group').hide();
        $('#time-and-date-all .date-picker').css({'opacity':'0.25'});
      } else {
        $('#time-and-date-all .date-select-group').show();
        $('#time-and-date-all .date-picker').css({'opacity':'1'});
      }
    });


    // Form validation & Walkthrough
    // This only works in description for now

    $('.section-save').on('click', function(event){

      var invalidFields = $(this).parentsUntil('.main-panel').find('*:invalid').length;
      var themeSelect = $(this).parentsUntil('.main-panel').find('#theme-select input:checked').length;

      // Validation is limited to Description for now.

      if ($('.page-header').data('section') === 'description') { 

        if (invalidFields === 0 && themeSelect !== 0) {
          // When the form validates
          $('#progress-panel').find('.active a .status').remove();
          $('#theme-select .alert').removeClass('alert-error').addClass('alert-info');
          $('#progress-panel .active a i.warning').remove();
          $('#progress-panel').find('.active a').removeClass('error');
          $('#progress-panel').find('.active a').append(' <i class="icon-check-sign complete status"></i>').addClass('complete');

          // $('#progress-panel li.active').next().addClass('active');

          // var url = $(this).data('next')+'.html';
          // $.pjax({url:url,container:'#main-panel',fragment:'#main-panel'});

          $('#progress-panel a[href='+$(this).attr('href')+']').tab('show');

          event.preventDefault();
        } else if (themeSelect === 0) {
          $('#progress-panel').find('.active a .status').remove();
          $('#progress-panel .active a i.complete').remove();
          $('#progress-panel').find('.active a').removeClass('complete');
         // $('#progress-panel').find('.active a').append(' <i class="icon-warning-sign warning status"></i>').addClass('error');
          $('#theme-select .alert').removeClass('alert-info').addClass('alert-error');
          $('#progress-panel a[href='+$(this).attr('href')+']').tab('show');
          event.preventDefault();
        } else {
          $('#progress-panel').find('.active a .status').remove();
          $('#progress-panel .active a i.complete').remove();
          $('#progress-panel').find('.active a').removeClass('complete');
         // $('#progress-panel').find('.active a').append(' <i class="icon-warning-sign warning status"></i>').addClass('error');
          $('#progress-panel a[href='+$(this).attr('href')+']').tab('show');
        }
      }
    });

    // Adding New Team Members 
    $('#add-member').on('click', 'section', function(){
      var newTarget = $(this).data('new');
      addMember(newTarget, function(){
        $('body').animate({ scrollTop: $('.new').last().offset().top-80 }, 1000);
      });
    });

    $('footer').on('click', '.remove-team-member, .remove-othermember', function() {
      $(this).parentsUntil('#walk-members').remove();
    });

    // Primary Walk Leader expose
    $('#role').change(function(){
      if ($(this).val() == "co-walk-leader") {
        $('#primary-walkleader-select').removeClass('hide');
      } else {
        $('#primary-walkleader-select').addClass('hide');
      }
    });

    // Notifications
    // Previewing Button
    $('#preview-walk').on('click', function(){
      $('#preview-modal').find('iframe').prop('src', previewUrl);
      $('#preview-modal').modal('show');
    });

    // Publish Walk Button
    $('#btn-submit').on('click', function(){
      $('#publish-warning').modal();
    });

    // Theme selection limiting
    $('#theme-select input[type=checkbox]').on('click', function(){
      if ($('#theme-select input[type=checkbox]:checked').length > 2) {
        $("#theme-select input[type=checkbox]:not(:checked)").prop('disabled', true);
      } else {
        $("#theme-select input[type=checkbox]:not(:checked)").prop('disabled', false);
      }
    });

    // Adding Resource
    $('#add-resource').on('click', function(event){
      var obj = addResource();
      // $('body').animate({ scrollTop: $('.new').last().offset().top-80 }, 1000);
      return false;
    });

    $('footer').on('click', '.remove-resourceitem', function() {
      $(this).parentsUntil('#resource-list').remove();
      return false;
    });


    // New Session Populate
    var walkTitle = $.paramsURL('title');
    var walkDescription = $.paramsURL('description');
    if (walkTitle) {
      $('#title').val(unescape(walkTitle));      
    }
    if (walkDescription) {
      $('#shortdescription').html(unescape(walkDescription));
    }

    // Time Picker
    $('#walk-time').timepicker(JanesWalk.form.timepicker_cfg);
    $('#walk-time').timepicker('setTime', JanesWalk.form.timepicker_cfg.defaultTime); // workaround for timepicker bug

    // Save Handler
    // Populate data if available
    // This data could be in the dom, or the url to the data could be in the dom as a js var, this example (/form.html?load=/js/sample.json) loads it from a url param
    var newPage = false;
    var dataUrl = $(".pagejson").data("url");
    var previewUrl = $(".pagejson").data("url");
    dataUrl += (dataUrl.indexOf("?") >= 0 ? "&" : "?") + "format=json";

    var notify_success = function() {
      $('body').append('<div class="alert alert-success" id="save-notify">Walk Saved</div>');
      setTimeout( function() {
        $('#save-notify').fadeOut('slow', function(){
          $(this).remove();
          });
        },2000);
    };
    var notify_error = function(error) {
      $('body').append('<div class="alert alert-error" id="save-notify">' + error.responseText + '</div>');
      setTimeout( function() {
        $('#save-notify').fadeOut('slow', function(){
          $(this).remove();
          });
        },2000);
    };

    $('.save, .btn-preview, .section-save').on('click', function(e){
      // Run validation first?
      $.ajax({
        type: "PUT",
        url: dataUrl,
        data: {json: JSON.stringify( JaneswalkData.build() )},
        success: notify_success,
        error: notify_error
        });
    });
    $('.btn-submit').click(function(e){
      $.ajax({
        type: "POST",
        url: dataUrl,
        data: {json: JSON.stringify( JaneswalkData.build() )},
        success: function() { console.log("Published Walk"); }
        });
      });
    if(JanesWalk.form.data) {
      JaneswalkData.fill(JanesWalk.form.data);
      console.log("Loaded data locally");
    } else if (dataUrl){
      console.log("Remote fetching data");
      // $('.progress-spinner').spin(spinProperties); TODO: replace with standard fontawesome spinner
      $.getJSON(dataUrl, function(data){
        JaneswalkData.fill(data);
      })
      .fail(function(){
        console.log("server error");
      })
      .always(function(){
      });
    }
  }
};

function addMember(newTarget, callback){
  var obj = $('#'+newTarget).clone(true,true).appendTo('#walk-members').addClass('new useredited').show();
  $("#name",obj).teamTypeahead();
  if (callback){
    callback();
  }
  return obj;
}

function addDateSet(selectedDate, selectedDuration, selectedTime){
  var inputs = '<input type="hidden" name="date-date[]" value="'+selectedDate+'">'+
  '     <input type="hidden" name="date-time[]" value="'+selectedTime+'">'+
  '     <input type="hidden" name="date-duration[]" value="'+selectedDuration+'">';
  var dateRow = '<tr><td>'+inputs+'<strong>'+selectedDate+'</strong></td><td>'+selectedTime+'</td><td><a href="#" id="remove-date"><i class="icon-remove"></i> Remove</a></td></tr>';
  $('#date-list-set tbody').append(dateRow);
}

function addDateAll(selectedDate, selectedDuration, selectedDateFormatted){
  var inputs = '<input type="hidden" name="date-date[]" value="'+selectedDate+'">'+
  '     <input type="hidden" name="date-duration[]" value="'+selectedDuration+'">';
  var dateRow = '<tr><td>'+inputs+'<strong>'+selectedDate+'</strong></td><td>'+selectedDuration+'</td><td><a href="#" id="remove-date" data-datedelete="'+selectedDateFormatted+'"><i class="icon-remove"></i> Remove</a></td></tr>';
  $('#date-list-all tbody').append(dateRow);
}

function addResource(){
  var obj = $('.resource-item-new.hide').clone(true,true).appendTo('#resource-list').addClass('new').removeClass('hide');
  return obj;
}

var globalThumbId;

// Data
var JaneswalkData = {
  description: ['title','shortdescription', 'longdescription'],
  accessible: ['accessible-info', 'accessible-transit', 'accessible-parking', 'accessible-find'],
  data: {},
  build: function() {
    this.dataSet= {};
    var self = this,
      name,
      value,
      file,
      desc;

    // Description
    $.each(this.description, function(key, value){
      self.dataSet[value] = $('[name="'+value+'"]').val();
    });

    // Theme checkboxes
    self.dataSet.checkboxes = {};
    $('[type="checkbox"][name^="theme-"]').each(function(){
      name = $(this).attr('name');
      value = $(this).prop('checked');
      self.dataSet.checkboxes[name] = value;
    });

    // Resources
    self.dataSet.resources = {};
    $('.resource-item, .resource-item-new').not('.hide').each(function(key, value){
      file = $(this).find('[name="resource-file[]"]').val();
      title = $(this).find('[name="resource-title[]"]').val();
      desc = $(this).find('[name="resource-description[]"]').val();
      self.dataSet.resources[key] = {file: file, title: title, description: desc};
    });

    // Wards
    self.dataSet.wards = $("#ward").val();

    // Map
    self.dataSet.map = {};
    self.dataSet.map.markers = {};
    $.each(jwMap.markers, function(key, val){
      self.dataSet.map.markers[key] = {
        title: val.title,
        description: val.description,
        questions: val.questions,
        style: val.style,
        lat: val.getPosition().lat(),
        lng: val.getPosition().lng()
      };
    });
    self.dataSet.map.route = {};
    $.each(jwMap.point, function(key, val){
      self.dataSet.map.route[key] = {
        lat: val.getPosition().lat(),
        lng: val.getPosition().lng(),
        title: val.title
      };
    });

    // Time - get type, and then get list of slots
    self.dataSet.time = {};
    self.dataSet.time.slots = {};
    if ($('#time-and-date-all').hasClass('active')){
      self.dataSet.time.type = 'all';
      self.dataSet.time.open = $('[type="checkbox"][name="open"]').prop('checked');
      $('#date-list-all tbody tr').each(function(key, value){
        self.dataSet.time.slots[key] = {date: $(this).find('[name="date-date[]"]').val(), duration: $(this).find('[name="date-duration[]"]').val()};
      });
    } else if ($('#time-and-date-set').hasClass('active')){
      self.dataSet.time.type = 'set';
      $('#date-list-set tbody tr').each(function(key, value){
        self.dataSet.time.slots[key] = {date: $(this).find('[name="date-date[]"]').val(), time: $(this).find('[name="date-time[]"]').val(), duration: $(this).find('[name="date-duration[]"]').val()};
      });
    } else {
      self.dataSet.time.type = false;
    }

    // Accessible
    $.each(this.accessible, function(key, value){
      self.dataSet[value] = $('[name="'+value+'"]').val();
    });

    // Accessible checkboxes
    $('[type="checkbox"][name^="accessible-"]').each(function(){
      name = $(this).attr('name');
      value = $(this).prop('checked');
      self.dataSet.checkboxes[name] = value;
    });

    // Team
    self.dataSet.team = {};
    var member;
    $('.team-member.useredited').each(function(key, val){
      var phone1 = $(this).find('[name="phone-1[]"]').val(),
        phone2 = $(this).find('[name="phone-2[]"]').val(),
        phone3 = $(this).find('[name="phone-2[]"]').val();

      member = {
        'user_id': $(this).find('[name="user_id[]"]').val(),
        'type': $(this).find('[name="type[]"]').val(),
        'profile-photo': $(this).find('[name="profile-photo[]"]').val(),
        'name-first': $(this).find('[name="name-first[]"]').val(),
        'name-last': $(this).find('[name="name-last[]"]').val(),
        'role': $(this).find('[name="role[]"]').val(),
        'primary': $(this).find('[name="primary[]"]').val(),
        'bio': $(this).find('[name="bio[]"]').val(),
        'twitter': $(this).find('[name="twitter[]"]').val(),
        'facebook': $(this).find('[name="facebook[]"]').val(),
        'website': $(this).find('[name="website[]"]').val(),
        'email': $(this).find('[name="email[]"]').val(),
        'institution': $(this).find('[name="institution[]"]').val()
      };

      if (phone1 !== undefined && phone2 !== undefined && phone3 !== undefined){
        member.phone = $(this).find('[name="phone-1[]"]').val()+'-'+$(this).find('[name="phone-2[]"]').val()+'-'+$(this).find('[name="phone-3[]"]').val();
      } else {
        member.phone = false;
      }

      self.dataSet.team[key] = member;
    });

    self.dataSet.thumbnail_id = globalThumbId;

    console.log(this.dataSet);
    console.log(JSON.stringify(this.dataSet));
    return this.dataSet;
  },

  fill: function(data){
    this.data = data;
    // Standard fields
    for(var key in data) {
      var obj = $('[name="'+key+'"]');
      if (obj.length > 0){
        if (obj.is('textarea')){
          obj.html(data[key]);
          if (key === 'longdescription'){
            // $('#longdescription').data("wysihtml5").editor.setValue(data[key]);
          }
        } else {
          obj.val(data[key]);
        }
      }
      else if(key === 'thumbnail_id' && data[key]) {
        var thumbLoad = $("iframe.walkphotos");
        var ifUrl = thumbLoad.attr('src');
        ifUrl = ifUrl.substring(0, ifUrl.indexOf("tools")) + "tools/files/importers/quick?fID=" + data[key];
        globalThumbId = data[key];
        thumbLoad.attr('src',ifUrl);
      }
    }

    // Checkboxes
    if (typeof(data.checkboxes) !== "undefined"){
      $.each(data.checkboxes, function(key, val){
        var obj = $('[name="'+key+'"]');
        if (obj.length > 0){
          obj.prop('checked', val);
        }
      });
    }

    // Resources
    if (typeof(data.resources) !== "undefined"){
      $.each(data.resources, function(key, val){
        var newObj = addResource();
        $.each(val, function(key, val){
          if (key != 'file'){
            newObj.find('[name="resource-'+key+'[]"]').val(val);
          } else {
            // format file box if file already exists
          }
        });
      });
    }

    // Time and Date
    if (typeof(data.time.type) != "undefined" && data.time.type !== false){

      if (data.time.type == 'all'){
        $('a[href="#time-and-date-all"]').tab('show');
      } else {
        $('a[href="#time-and-date-set"]').tab('show');
      }
      
      $.each(data.time.slots, function(key, val){
        if (data.time.type == 'all'){
          addDateAll(val.date, val.duration, val.time);
        } else {
          addDateSet(val.date, val.duration, val.time);
        }
      });
    }

    // Team
    if (typeof(data.team) !== "undefined"){
      $.each(data.team, function(key, member){
        var newTarget,
        obj;
        // you, leader, organizer, community, volunteer
        if (member.type === 'you'){
          obj = $('#walk-leader-me');
        } else if (member.type === 'leader'){
          newTarget = 'walk-leader-new';
          obj = addMember(newTarget);
        } else if (member.type === 'organizer'){
          newTarget = 'walk-organizer-new';
          obj = addMember(newTarget);
        } else if (member.type === 'community'){
          newTarget = 'community-voice-new';
          obj = addMember(newTarget);
        } else if (member.type === 'volunteer'){
          newTarget = 'othermember-new';
          obj = addMember(newTarget);
        }
        JaneswalkData.teamPopulate(member, obj);
      });
    }
  },

  mapPopulate: function(jwMap) {
    if (this.data.map && typeof(this.data.map) !== "undefined"){
      if (this.data.map.markers && typeof(this.data.map.markers) !== "undefined"){
        $.each(this.data.map.markers, function(key, marker){
          if(marker.lat && marker.lng) {
            if (marker.style == 'meeting'){
              jwMap.addmeetingplace(null, marker.title, marker.description, marker.lat, marker.lng);
            } else {
              jwMap.addmarker(null, marker.title, marker.description, marker.questions, marker.lat, marker.lng);
            }
          }
        });
      }
      if (this.data.map && typeof(this.data.map.route) !== "undefined"){
        $.each(this.data.map.route, function(key, point){
          jwMap.addlines(null, point.title, point.lat, point.lng);
        });
      }
      jwMap.centerRoute();
    }
  },

  teamPopulate: function(data, target){
    $.each(data, function(key, val){
      var obj = $(target).find('[name="'+key+'[]"]');
      if (obj.length > 0 && (obj.is("input") && (obj.attr("type") === "text" || obj.attr("type") == "email")) || obj.is("textarea") || obj.is("select")){
        obj.val(val).change();
      } else if (obj.length > 0 && obj.is("input") && obj.attr("type") == "checkbox"){
        obj.prop("checked", val);
      }

      if (key == "phone" && val !== false){
        $(target).find('[name="phone[]"]').val(val);
      }
    });
  }
};

// On page load
document.addEventListener("DOMContentLoaded", function() {
  if (document.body.dataset.pageviewname === 'CreateWalkView') {
    // TODO: Update MCE version after c5.7 upgrade
    // We need to make the tabs displayed but not visible, so we can init
    // certain elements at the correct size, e.g. tinyMCE
    $('.tab-pane').attr('style', 'display:block;z-index:-99999;');
    tinyMCE.init({
      mode: 'textareas',
      theme: 'advanced',
      theme_advanced_toolbar_location: 'top',
      theme_advanced_toolbar_align: 'left',
      theme_advanced_buttons1: 'bold,italic,underline,separator,bullist,numlist',
      theme_advanced_buttons2: '',
      theme_advanced_buttons3: '',
      oninit: function() { $('.tab-pane').attr('style', ''); }
    });

    // Set DOM listener on page load.
    if ($('#map-canvas').length > 0) {
      jwMap = new MapEditor(JanesWalk);
      JaneswalkData.mapPopulate(jwMap);
    }

    // Scroll top on tab change 
    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e){
      $('body').scrollTop(0);
      $('.walk-submit').addClass('hide');
    });

    $('a[href="#route"][data-toggle="tab"]').on('shown.bs.tab', function(e) {
      google.maps.event.trigger(jwMap.map, 'resize');
      jwMap.centerRoute();
    });

    Janeswalk.initialize();
  }
});

