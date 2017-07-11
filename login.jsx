import React from "react";

class Login extends React.Component {

  static signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(console.log("User signed out."));
  }

  constructor(props) {
    super(props);
    this.state = {
      signedIn: false,
      email: {},
      fullname: {},
    };

    window.onSignIn = (response) => {
      const profile = response.getBasicProfile();
      this.setState({ signedIn: true, email: profile.getEmail(), fullname: profile.getName() });
    };
  }

  render() {
    return (
      <div>
        <div className="g-signin2" data-onsuccess="onSignIn" data-width="100" data-height="80" />
        { this.state.signedIn ?
          <div>Hi {this.state.fullname}</div>
            :
          <div />
        }
      </div>
    );
  }
}

export default Login;
