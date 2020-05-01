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
    
    function resetSolution() {
        $("#sudokuPicture").val('');
        enableOrDisableUploadButton(true);
        $("#sudokuResult").addClass("d-none");
        $("#sudokuUploader").removeClass("d-none");
    }

    function displayUploadAlert(message){
        if (message == undefined) {
            $("#uploadAlerts").text("").addClass("d-none");
        }else{
            $("#uploadAlerts").text(message).removeClass("d-none");
        }
    }

    function enableOrDisableUploadButton(enable){
        if (enable){
            $('#sudokuPictureBtn').prop('disabled', false);
            $('#sudokuPictureBtn').text("Upload")
        }else{
            $('#sudokuPictureBtn').text("Loading ...")
            $('#sudokuPictureBtn').prop('disabled', true);
        }
    }

    function resizeAndUploadFile(current_file){
      // var current_file = files[0];
      var reader = new FileReader();
      if (current_file.type.indexOf('image') == 0) {
        reader.onload = function (event) {
            var image = new Image();
            image.src = event.target.result;

            image.onload = function() {
              var maxWidth = 1024,
                  maxHeight = 1024,
                  imageWidth = image.width,
                  imageHeight = image.height;


              if (imageWidth > imageHeight) {
                if (imageWidth > maxWidth) {
                  imageHeight *= maxWidth / imageWidth;
                  imageWidth = maxWidth;
                }
              }
              else {
                if (imageHeight > maxHeight) {
                  imageWidth *= maxHeight / imageHeight;
                  imageHeight = maxHeight;
                }
              }

              var canvas = document.createElement('canvas');
              canvas.width = imageWidth;
              canvas.height = imageHeight;
              image.width = imageWidth;
              image.height = imageHeight;
              var ctx = canvas.getContext("2d");
              ctx.drawImage(this, 0, 0, imageWidth, imageHeight);

              // Convert the resize image to a new file to post it.
              uploadFile(canvas.toDataURL(current_file.type));
            }
        }
        reader.readAsDataURL(current_file);
      }
    }

    function uploadFile(file) {

        $.ajax({
            type: 'POST',
            url: 'https://ij6seywf7a.execute-api.eu-west-3.amazonaws.com/prod/solve',
            data: file,
            headers: {
                Authorization: authToken
            },
            processData: false,
            contentType: false,
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                displayUploadAlert('An error occured:\n' + jqXHR.responseText);
                enableOrDisableUploadButton(true);
            }
        })
    };
    
    function requestSolution(picture) {
        displayUploadAlert();
        var input = document.getElementById('sudokuPicture');
        if (!input) {
            displayUploadAlert("Couldn't find the fileinput element.");
        } else if (!input.files) {
            displayUploadAlert("This browser doesn't seem to support the `files` property of file inputs.");
        } else if (!input.files[0]) {
            displayUploadAlert("Please select a file before clicking 'Load'");               
        } else {
            var file = input.files[0];
            enableOrDisableUploadButton(false);

            resizeAndUploadFile(file);
        }
    }

    function completeRequest(result) {
        enableOrDisableUploadButton(true);
        $("#sudokuResultImage").attr('src',result);
        $("#sudokuUploader").addClass("d-none");
        $("#sudokuResult").removeClass("d-none");
    }

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

        $('#sudokuPictureBtn').click(function() {
            requestSolution("");
        });

        $('#sudokuResetBtn').click(function() {
            resetSolution("");
        });

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
