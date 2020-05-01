/*global SudokuSolver _config*/

var SudokuSolver = window.SudokuSolver || {};
SudokuSolver.map = SudokuSolver.map || {};

// On initialise la latitude et la longitude de Paris (centre de la carte)
var lat = 48.852969;
var lon = 2.349903;
var map = null;

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

    function displayAddressAlert(message){
        if (message == undefined) {
            $("#addressAlerts").text("").addClass("d-none");
        }else{
            $("#addressAlerts").text(message).removeClass("d-none");
        }
    }

    function autocompleteAddress(){
        var input = document.getElementById('locatorAddress');
        var addressOptions = {
            componentRestrictions: {
                country: 'fr'
            }
        };
        
        var autocomplete = new google.maps.places.Autocomplete(input, addressOptions);

        $("#sudokuPictureBtn").click(function() {
            displayAddressAlert();
            var text = $("#locatorAddress").text();
            var place = autocomplete.getPlace();
            
            if(place != undefined){
                var lat = place.geometry.location.lat();
                var long = place.geometry.location.lng();

                var myLatLng = {lat: lat, lng: long};

                var map = new google.maps.Map(document.getElementById('locatorMaps'), {
                    zoom: 8,
                    center: myLatLng
                });

                var marker = new google.maps.Marker({
                    position: myLatLng,
                    map: map,
                    title: 'Home'
                });

                var homeAllowMvtCircle = new google.maps.Circle({
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.35,
                    map: map,
                    center: myLatLng,
                    radius: 100 * 1000
                });
            } else if(text == undefined || text.trim() == ""){
                displayAddressAlert("Use the address input bar to search your home address.");
            } else {
                displayAddressAlert("Use the autocomplete function to select valid address.");
            }
        });
    }

    // Fonction d'initialisation de la carte
    function initMap() {
        // Créer l'objet "map" et l'insèrer dans l'élément HTML qui a l'ID "map"
        map = new google.maps.Map(document.getElementById("locatorMaps"), {
            // Nous plaçons le centre de la carte avec les coordonnées ci-dessus
            center: new google.maps.LatLng(lat, lon), 
            // Nous définissons le zoom par défaut
            zoom: 11, 
            // Nous définissons le type de carte (ici carte routière)
            mapTypeId: google.maps.MapTypeId.ROADMAP, 
            // Nous activons les options de contrôle de la carte (plan, satellite...)
            mapTypeControl: false,
            // Nous désactivons la roulette de souris
            scrollwheel: true, 
            mapTypeControlOptions: {
                // Cette option sert à définir comment les options se placent
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR 
            },
            // Activation des options de navigation dans la carte (zoom...)
            navigationControl: true, 
            navigationControlOptions: {
                // Comment ces options doivent-elles s'afficher
                style: google.maps.NavigationControlStyle.ZOOM_PAN 
            }
        });
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
        autocompleteAddress();

    });

}(jQuery));
