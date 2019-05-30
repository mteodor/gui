import React from 'react';
import PropTypes from 'prop-types';
import cookie from 'react-cookie';
import AppStore from '../../stores/app-store';
import { clearAllRetryTimers } from '../../utils/retrytimer';
import { Redirect } from 'react-router-dom';
import AppActions from '../../actions/app-actions';
import { preformatWithRequestID } from '../../helpers';

export default class Login extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
    location: PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
    this.state = this._getState();
  }
  componentWillMount() {
    AppStore.changeListener(this._onChange.bind(this));
 
  }

  componentWillUnmount() {
    AppStore.removeChangeListener(this._onChange.bind(this));
    AppActions.setSnackbar('');
  }

  componentDidMount() {
    clearAllRetryTimers();
    AppActions.setCurrentUser(null);
    this._handleLoginSSO();
  }

  _getState() {
    return {
      redirectToReferrer: false
    };
  }

  _onChange() {
    this.setState(this._getState());
  }

  _handleLoginSSO() {
    var self = this;
    return AppActions.loginUserSSO()
      .then(token => {
        console.log('received token:' +  token );
        var options = {maxAge:3600};
        // maxAge for cookie maybe to be set from id_token 

        // set no expiry as cookie to remember checkbox value
        cookie.save('noExpiry', 'true');

        // save token as cookie
        // set maxAge if noexpiry checkbox not checked
        cookie.save('JWT', token, options);

        // logged in, so redirect
        self.setState({ redirectToReferrer: true });
        return AppActions.setSnackbar('');
      })
      .catch(err => {
        var errMsg = 'There was a problem logging in';
        console.log(errMsg);
        if (err.res.body && Object.keys(err.res.body).includes('error')) {
          // if error message, check for "unauthorized"
          errMsg = err.res.body['error'] === 'unauthorized' ? 'The username or password is incorrect' : `${errMsg}: ${err.res.body['error']}`;
        }
        AppActions.setSnackbar(preformatWithRequestID(err.res, errMsg), null, 'Copy to clipboard');
      });
  }

  render() {

    let { from } = { from: { pathname: '/' } };
    if (this.props.location.state && this.props.location.state.from.pathname !== '/ui/') {
      from = this.props.location.state.from;
    }
    let { redirectToReferrer } = this.state;
    if (redirectToReferrer) {
      return <Redirect to={from} />;
    }

    var title = 'SSO Log in';
    return (
      <div className="full-screen">
        <div id="login-box">
          <h3>{title}</h3>
          <img src="assets/img/loginlogo.png" alt="mender-logo" className="margin-bottom-small" />

          <div className="clear" />
          
        </div>
      </div>
    );
  }
}
