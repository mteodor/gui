import React from 'react';

import AppActions from '../../actions/app-actions';

export default class DeploymentStatus extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      stats: {
        success: 0,
        decommissioned: 0,
        pending: 0,
        failure: 0,
        downloading: 0,
        installing: 0,
        rebooting: 0,
        noartifact: 0,
        aborted: 0,
        'already-installed': 0
      }
    };
  }
  componentWillReceiveProps(nextProps) {
    var self = this;
    if (nextProps.id !== this.props.id) this.refreshStatus(nextProps.id);
    if (!nextProps.isActiveTab) {
      clearInterval(this.timer);
    }

    if (nextProps.isActiveTab && !self.props.isActiveTab) {
      // isActive has changed
      if (self.props.refresh) {
        self.timer = setInterval(() => {
          self.refreshStatus(self.props.id);
        }, 10000);
      }
    }
  }
  componentDidMount() {
    var self = this;
    if (self.props.refresh) {
      self.timer = setInterval(() => {
        self.refreshStatus(self.props.id);
      }, 10000);
    }
    self.refreshStatus(self.props.id);
  }
  componentWillUnmount() {
    clearInterval(this.timer);
  }
  refreshStatus(id) {
    var self = this;
    return AppActions.getSingleDeploymentStats(id).then(stats => {
      self.setState({ stats });
      if (stats.downloading + stats.installing + stats.rebooting + stats.pending <= 0) {
        // if no more devices in "progress" statuses, send message to parent that it's finished
        clearInterval(self.timer);
        self.props.setFinished(true);
      }
    });
  }
  render() {
    var inprogress = this.state.stats.downloading + this.state.stats.installing + this.state.stats.rebooting;
    var failed = this.state.stats.failure;
    var skipped = this.state.stats.aborted + this.state.stats.noartifact + this.state.stats['already-installed'] + this.state.stats.decommissioned;
    var label = (
      <div className={this.props.vertical ? 'results-status vertical' : 'results-status'}>
        <div className={skipped ? 'hint--bottom' : 'hint--bottom disabled'} aria-label="Skipped">
          <span className="status skipped">{skipped || 0}</span>
          {this.props.vertical ? <span className="label">Skipped</span> : null}
        </div>
        <div className={this.state.stats.pending ? 'hint--bottom' : 'hint--bottom disabled'} aria-label="Pending">
          <span className={'status pending'}>{this.state.stats.pending}</span>
          {this.props.vertical ? <span className="label">Pending</span> : null}
        </div>
        <div className={inprogress ? 'hint--bottom' : 'hint--bottom disabled'} aria-label="In progress">
          <span className={'status inprogress'}>{inprogress}</span>
          {this.props.vertical ? <span className="label">In progress</span> : null}
        </div>
        <div className={this.state.stats.success ? 'hint--bottom' : 'hint--bottom disabled'} aria-label="Successful">
          <span className="status success">{this.state.stats.success}</span>
          {this.props.vertical ? <span className="label">Successful</span> : null}
        </div>
        <div className={failed ? 'hint--bottom' : 'hint--bottom disabled'} aria-label="Failures">
          <span className={'status failure'}>{failed}</span>
          {this.props.vertical ? <span className="label">Failed</span> : null}
        </div>
      </div>
    );
    return <div>{label}</div>;
  }
}
