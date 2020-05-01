/*global SudokuSolver _config*/

var SudokuSolver = window.SudokuSolver || {};
SudokuSolver.map = SudokuSolver.map || {};

var payloadToken = {};

(function homeScopeWrapper($) {
    var authToken;
    SudokuSolver.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = 'login.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = 'login.html';
    });

    function parseJwt (token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    };

    // Register click handler for #request button
    $(function onDocReady() {

        $('#logoutBtn').click(function() {
            SudokuSolver.signOut();
            
            window.location = "login.html";
        });

        SudokuSolver.authToken.then(function updateAuthMessage(token) {
            if (token) {
                payloadToken = parseJwt(token);
                $("#userEmailInfo").text(payloadToken['cognito:username']);
            }
        });

    });

}(jQuery));
