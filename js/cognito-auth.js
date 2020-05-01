/*global SudokuSolver _config AmazonCognitoIdentity AWSCognito*/

var SudokuSolver = window.SudokuSolver || {};

(function authScopeWrapper($) {
    var poolData = {
        UserPoolId: _config.cognito.userPoolId,
        ClientId: _config.cognito.userPoolClientId
    };

    var userPool;

    if (!(_config.cognito.userPoolId &&
          _config.cognito.userPoolClientId &&
          _config.cognito.region)) {
        return;
    }

    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    if (typeof AWSCognito !== 'undefined') {
        AWSCognito.config.region = _config.cognito.region;
    }

    SudokuSolver.signOut = function signOut() {
        userPool.getCurrentUser().signOut();
    };

    SudokuSolver.authToken = new Promise(function fetchCurrentAuthToken(resolve, reject) {
        var cognitoUser = userPool.getCurrentUser();

        if (cognitoUser) {
            cognitoUser.getSession(function sessionCallback(err, session) {
                if (err) {
                    reject(err);
                } else if (!session.isValid()) {
                    resolve(null);
                } else {
                    resolve(session.getIdToken().getJwtToken());
                }
            });
        } else {
            resolve(null);
        }
    });

    function createCognitoUser(email) {
        return new AmazonCognitoIdentity.CognitoUser({
            Username: email,
            Pool: userPool
        });
    }



    function signin(email, password, onSuccess, onFailure) {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password
        });

        var cognitoUser = createCognitoUser(email);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: onSuccess,
            onFailure: onFailure,
            newPasswordRequired: function (userAttributes) {
                delete userAttributes.email_verified;

                // Get the new password
                var newPassword = prompt("Enter your new password with at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character:");

                cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, this);
            }
        });
    }

    /*
     *  Event Handlers
     */

    $(function onDocReady() {
        $('#signinForm').submit(handleSignin);
        // Logout user if already signed in
        try {
            if('login.html' == window.location.pathname){
                SudokuSolver.signOut();
            }
        } catch(error) {
          console.log(error);
        }


    });

    function enableOrDisableLoginButton(enable){
        if (enable){
            $('#sudokuLoginBtn').prop('disabled', false);
            $('#sudokuLoginBtn').text("Login")
        }else{
            $('#sudokuLoginBtn').text("Loading ...")
            $('#sudokuLoginBtn').prop('disabled', true);
        }
    }

    function displayLoginAlert(message){
        if (message == undefined) {
            $("#loginAlerts").text("").addClass("d-none");
        }else{
            $("#loginAlerts").text(message).removeClass("d-none");
        }
    }

    function handleSignin(event) {
        displayLoginAlert();
        enableOrDisableLoginButton(false);
        var email = $('#emailInputSignin').val();
        var password = $('#passwordInputSignin').val();
        event.preventDefault();
        signin(email, password,
            function signinSuccess() {
                enableOrDisableLoginButton(true);
                console.log('Successfully Logged In');
                window.location.href = 'index.html';
            },
            function signinError(err) {
                enableOrDisableLoginButton(true);
                var messagePosition = err.toString().indexOf(": ");
                if (messagePosition > 0){
                    displayLoginAlert(err.toString().substring(messagePosition + 1));
                }else{
                    displayLoginAlert(err);
                }
            }
        );
    }
}(jQuery));
