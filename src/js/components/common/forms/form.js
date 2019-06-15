import validator from 'validator';
import React from 'react';

import Button from '@material-ui/core/Button';

export default class Form extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      isSubmitting: false,
      isValid: false
    };
  }
  componentWillMount() {
    this.model = {};
    this.newChildren = {};
    this.inputs = {}; // We create a map of traversed inputs
    this.registerInputs(); // We register inputs from the children
  }
  componentDidUpdate() {
    this.registerInputs();
  }
  componentWillUpdate(nextProps) {
    const self = this;
    self.newChildren = React.Children.map(
      // Use nextprops for registering components cwu
      nextProps.children,
      child => self._cloneChild(child, self)
    );
  }
  registerInputs() {
    const self = this;
    self.newChildren = React.Children.map(self.props.children, child => self._cloneChild(child, self));
  }

  // eslint-disable-next-line consistent-this
  _cloneChild(child, self) {
    // If we use the required prop we add a validation rule
    // that ensures there is a value. The input
    // should not be valid with empty value
    var validations = child.props.validations || '';
    if (child.props.required && validations.indexOf('isLength') == -1) {
      validations = validations ? `${validations}, ` : validations;
      validations += 'isLength:1';
    }
    return React.cloneElement(child, {
      validations: validations,
      attachToForm: self.attachToForm.bind(self),
      detachFromForm: self.detachFromForm.bind(self),
      updateModel: self.updateModel.bind(self),
      validate: self.validate.bind(self),
      hideHelp: self.props.hideHelp,
      handleKeyPress: self._handleKeyPress.bind(self)
    });
  }

  validate(component, value) {
    if (!component.props.validations) {
      return;
    }

    var isValid = true;
    var errortext = '';

    if (component.props.file) {
      if (component.props.required && !value) {
        isValid = false;
        errortext = 'You must choose a file to upload';
      }
    } else if (component.props.id === 'password') {
      if (component.props.required && !value) {
        isValid = false;
        errortext = 'Password is required';
      } else if (value && value.length < 2) {
        isValid = false;
        errortext = 'Password too weak';
      }
    } else {
      if (value || component.props.required) {
        component.props.validations.split(',').forEach(validation => {
          var args = validation.split(':');
          var validateMethod = args.shift();
          // We use JSON.parse to convert the string values passed to the
          // correct type. Ex. 'isLength:1' will make '1' actually a number
          args = args.map(arg => {
            return JSON.parse(arg);
          });

          var tmpArgs = args;
          // We then merge two arrays, ending up with the value
          // to pass first, then options, if any. ['valueFromInput', 5]
          args = [value].concat(args);
          // So the next line of code is actually:
          // validator.isLength('valueFromInput', 5)
          if (!validator[validateMethod].apply(validator, args)) {
            errortext = this.getErrorMsg(validateMethod, tmpArgs);
            isValid = false;
          }
        });
      }
    }

    // Now we set the state of the input based on the validation
    component.setState(
      {
        isValid: isValid,
        errortext: errortext
        // We use the callback of setState to wait for the state
        // change being propagated, then we validate the form itself
      },
      this.validateForm.bind(this)
    );
  }

  getErrorMsg(validateMethod, args) {
    switch (validateMethod) {
    case 'isLength':
      if (args[0] === 1) {
        return 'This field is required';
      } else if (args[0] > 1) {
        return `Must be at least ${args[0]} characters long`;
      }
      break;
    case 'isAlpha':
      return 'This field must contain only letters';
    case 'isAlphanumeric':
      return 'This field must contain only letters or numbers';
    case 'isEmail':
      return 'Please enter a valid email address';
    default:
      return 'There is an error with this field';
    }
  }

  validateForm() {
    // We set allIsValid to true and flip it if we find any
    // invalid input components
    var allIsValid = true;

    // Now we run through the inputs registered and flip our state
    // if we find an invalid input component
    var inputs = this.inputs;
    Object.keys(inputs).forEach(name => {
      if (!inputs[name].state.isValid || (inputs[name].props.required && !inputs[name].state.value)) {
        allIsValid = false;
      }
    });

    // And last, but not least, we set the valid state of the
    // form itself
    this.setState({
      isValid: allIsValid
    });
  }

  // All methods defined are bound to the component by React JS, so it is safe to use "this"
  // even though we did not bind it. We add the input component to our inputs map
  attachToForm(component) {
    console.log("attaching component:" + component.props.id)
    this.inputs[component.props.id] = component;
    this.model[component.props.id] = component.state.value || component.state.checked;

    // We have to validate the input when it is attached to put the
    // form in its correct state
    //this.validate(component);
  }

  // We want to remove the input component from the inputs map
  detachFromForm(component) {
    console.log("dettaching component:" + component.props.id)
    delete this.inputs[component.props.id];
    delete this.model[component.props.id];
  }
  authenticateOnOIDC(){
    window.open("http://mender.solidsense.tk/auth/realms/kapua/protocol/openid-connect/auth?scope=openid&response_type=code&client_id=console&redirect_uri=http://mender.solidsense.tk/ui/","_self")
  }
  updateModel() {
    Object.keys(this.inputs).forEach(name => {
      // re validate each input in case submit button pressed too soon
      this.validate(this.inputs[name], this.inputs[name].state.value);
    });

    this.validateForm();
    Object.keys(this.inputs).forEach(id => {
      this.model[id] = this.inputs[id].state.value || this.inputs[id].state.checked;
    });
    if (this.state.isValid) {
      this.props.onSubmit(this.model);
    }
  }
  _handleKeyPress(event) {
    event.stopPropagation();
    if (event.key === 'Enter' && this.state.isValid) {
      this.updateModel();
    }
  }
  render() {
    var uploadActions = this.props.showButtons ? (
      <div className="float-right" style={this.props.dialog ? { margin: '24px 0 -16px 0' } : { marginTop: '32px' }}>
        {this.props.handleCancel ? (
          <Button key="cancel" onClick={this.props.handleCancel} style={{ marginRight: '10px', display: 'inline-block' }}>
            Cancel
          </Button>
        ) : null}
        <Button
          variant="contained"
          key="submit"
          id={this.props.submitButtonId}
          color={this.props.buttonColor}
          onClick={() => this.updateModel()}
          disabled={!this.state.isValid}
        >
          {this.props.submitLabel}
        </Button>


        {this.props.ssoMode ? (
          <Button
            variant="contained"
            key="submitSSO"
            id={this.props.submitButtonSSOId}
            color={this.props.buttonSSOColor}
            onClick={() => this.authenticateOnOIDC()}
            disabled={false}
          >
            {this.props.submitSSOLabel}
          </Button>
        ) : null}

      </div>
    ) : null;

    return (
      <form key={this.props.uniqueId} className={this.props.className || ''}>
        {this.newChildren}
        {uploadActions}
      </form>
    );
  }
}
