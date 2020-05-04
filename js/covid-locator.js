var SudokuSolver = window.SudokuSolver || {};
SudokuSolver.map = SudokuSolver.map || {};

// On initialise la latitude et la longitude de Paris (centre de la carte)
var initLat = 48.852969;
var initLon = 2.349903;
var map = null;
var locationMarker = null;
var homeMarker = null;
var homeCircle = null;
var positionCircle = null;

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

    function displayAddressAlert(message){
        if (message == undefined) {
            $("#addressAlerts").text("").addClass("d-none");
        }else{
            $("#addressAlerts").text(message).removeClass("d-none");
        }
    }

    function autoCompleteAddress(){
        $("#locatorAddress").on( "keydown", function( event ) {
            if ( event.keyCode === $.ui.keyCode.TAB &&
                $( this ).autocomplete( "instance" ).menu.active ) {
              event.preventDefault();
            }
        })
        .autocomplete({
            minLength: 2,
            source: function (request, response) {
                displayAddressAlert();
                $.ajax({
                    url: "https://api-adresse.data.gouv.fr/search/",
                    data: { 
                      q: request.term,
                      limit: 5
                    },
                    dataType: "json",
                    success: function (data) {
                        response($.map(data.features, function (item) {
                            return { label: item.properties.label, value: item.properties.label, coordinates: item.geometry.coordinates};
                        }));
                    },
                    error: function(errorMsg){
                        displayAddressAlert("Erreur avec le service d'adresses. Reessayez plus tard.");
                        resetMaps();
                        console.log(errorMsg);
                    }
                });
            },
            select: function ( event, ui) {
                displayResult(ui.item.coordinates);
            }
        });
    }

    function hideKeyboard(element) {
        element.attr('readonly', 'readonly'); // Force keyboard to hide on input field.
        element.attr('disabled', 'true'); // Force keyboard to hide on textarea field.
        setTimeout(function() {
            element.blur();  //actually close the keyboard
            // Remove readonly attribute after keyboard is hidden.
            element.removeAttr('readonly');
            element.removeAttr('disabled');
        }, 100);
    }

    function initSearchAgain(){
        $("#locatorBtn").click(function() {
            displayAddressAlert();
            var address = $("#locatorAddress").val();
            if(address != undefined && address.length > 2){
                $.ajax({
                    url: "https://api-adresse.data.gouv.fr/search/",
                    data: { 
                      q: address,
                      limit: 5
                    },
                    dataType: "json",
                    success: function (data) {
                        if(data.features.length > 0){
                            displayResult(data.features[0].geometry.coordinates);
                            $("#locatorAddress").val(data.features[0].properties.label)
                        }else{
                            displayAddressAlert("Erreur avec l'adresse. Utilisez le champ de recherche.");
                            resetMaps();
                        }
                    },
                    error: function(errorMsg){
                        displayAddressAlert("Erreur avec le service d'adresses. Reessayez plus tard.");
                        resetMaps();
                        console.log(errorMsg);
                    }
                });
            }else{
                displayAddressAlert("Erreur avec l'adresse. Utilisez le champ de recherche.");
                resetMaps();
            }
        });
        $("#clearBtn").click(function() {
            resetMaps();
        });
    }

    function resetMaps(){
        $("#locatorAddress").val('');
        if (homeMarker != undefined){
            map.removeLayer(homeMarker);
        }
        if (homeCircle != undefined){
            map.removeLayer(homeCircle);
        }
        if (locationMarker != undefined){
            map.removeLayer(locationMarker);
        }
    }

    function displayResult(coordinates){
        hideKeyboard($("#locatorAddress"));
        if (homeMarker != undefined){
            map.removeLayer(homeMarker);
        }
        if (homeCircle != undefined){
            map.removeLayer(homeCircle);
        }
        var latlng = new L.LatLng(coordinates[1], coordinates[0]);
        homeMarker = L.marker(latlng).addTo(map).bindPopup('Mon domicile');
        homeCircle = L.circle(latlng, 100000).addTo(map);
        map.setView(latlng, 8);
    }

    function initMyLocationBtn(){
        $("#myLocationBtn").click(function() {
            displayAddressAlert();
            // Try HTML5 geolocation.
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(location) {
                    if (locationMarker != undefined){
                        map.removeLayer(locationMarker);
                    }
                    var latlng = new L.LatLng(location.coords.latitude, location.coords.longitude);
                    locationMarker = L.marker(latlng).addTo(map).bindPopup('Ma position');
                    map.setView(latlng, 7);

                }, function() {
                    handleLocationError(true);
                });
            } else {
                // Browser doesn't support Geolocation
                handleLocationError(false);
            }
        });
    }


    function saveBase64AsFile(base64, fileName) {
        var link = document.createElement("a");
        link.setAttribute("href", base64);
        link.setAttribute("download", fileName);
        link.click();
    }

    function handleLocationError(browserHasGeolocation) {
        displayAddressAlert(browserHasGeolocation ?
                              'Erreur: La geolocalisation a echoué.' :
                              'Error: Votre navigateur ne supporte pas la geolocalisation !');
    }

    // Fonction d'initialisation de la carte
    function initMap() {
        map = L.map('locatorMaps').setView([initLat, initLon], 8); // LIGNE 18

        var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', { // LIGNE 20
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
    
        map.addLayer(osmLayer);
    }

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

        initMap();
        autoCompleteAddress();
        initMyLocationBtn();

        initSearchAgain();

    });

}(jQuery));
