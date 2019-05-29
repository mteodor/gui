import React from 'react';
import PropTypes from 'prop-types';

export default class Login extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
    location: PropTypes.object
  };

  constructor(props, context) {
    super(props, context);
  }

  componentWillMount() {
    AppStore.changeListener(this._onChange.bind(this));
  }
  
  componentDidMount() {
    clearAllRetryTimers();
    AppActions.setCurrentUser(null);
  }

  render() {
    

    var title = 'Logged out';
    return (
      <div className="full-screen">
        <div id="login-box">
          <h3>{title}</h3>
          <img src="assets/img/loginlogo.png" alt="mender-logo" className="margin-bottom-small" />
 

          <div className="clear" />
          <div className="flexbox margin-top" style={{ color: 'rgba(0, 0, 0, 0.3)', justifyContent: 'center' }}>
            <span>
              <a style={{ marginLeft: '4px' }} href="/ui/#/login" target="_self">
                  Login
              </a>
            </span>
          </div>
        </div>
      </div>
    );
  }
}
