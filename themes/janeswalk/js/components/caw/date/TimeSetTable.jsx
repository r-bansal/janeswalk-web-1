// Flux
const i18n = require('../../../stores/I18nStore.js');
const t = i18n.getTranslate();
const t2 = i18n.getTranslatePlural();

/**
 * The table with all the times that the walks are scheduled
 */
export default class TimeSetTable extends React.Component {
  // Remove a scheduled time
  removeSlot(i) {
    const valueLink = this.props.valueLink;
    const value = valueLink.value;
    const slots = (value.slots || []).slice();

    slots.splice(i, 1);
    value.slots = slots;

    valueLink.requestChange(value);
  }

  render() {
    const slots = this.props.valueLink.value.slots || [];

    const dtfDate = new Intl.DateTimeFormat('en-US', {year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'});
    const dtfDuration = new Intl.DateTimeFormat('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'UTC'});

    return (
      <table className="table table-bordered table-hover" id="date-list-all">
        <thead>
          <tr>
            <th>{t('Date')}</th>
            <th>{t('Start Time')}</th>
            <th>{t('Duration')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => {
            const start = (new Date(slot[0] * 1000));
            const duration = (new Date((slot[1] - slot[0]) * 1000));

            const hours = duration.getUTCHours();
            const minutes = duration.getUTCMinutes();
            const durationFmt = [];
            if (hours) {
              durationFmt.push(t2('%d Hour', '%d Hours', hours));
            }
            if (minutes) {
              durationFmt.push(t2('%d Minute', '%d Minutes', minutes));
            }

            return (
              <tr key={i}>
                <td>{dtfDate.format(start)}</td>
                <td>{dtfDuration.format(start)}</td>
                <td>{durationFmt.join(', ')}</td>
                <td><a onClick={this.removeSlot.bind(this, i)}><i className="fa fa-times-circle-o" />&nbsp;{t('Remove')}</a></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}
