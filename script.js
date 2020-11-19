'use strict';
import Leaflet , {icon} from 'leaflet';
import 'leaflet/dist/leaflet.css';


const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
    #mapEvent;
    #map;
    constructor(){
        this._getPosition();
        form.addEventListener('submit' , this._newWorkOut.bind(this));
        inputType.addEventListener('change',this._toggleElevationField);
    }
    _getCurrentPosition(){
        return new Promise(function (resolve ,reject){
            navigator.geolocation.getCurrentPosition(
                (data)=>{resolve(data);},
                (err)=>{reject(err);}
            );
        });
    }
    _getPosition(){
        this._getCurrentPosition()
        .then(this._loadMap.bind(this))
        .catch(this._handleError);
        
    }
    _loadMap(pos){
        const  { coords : { latitude , longitude }  } = pos;
        const coords = [latitude , longitude];
        this.#map = Leaflet.map('map').setView(coords, 13);
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click" , handleMapClick.bind(this));
        function handleMapClick(e){
            this.#mapEvent = e;
            this._showForm();
            return;
        }
    }
    _showForm(){
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkOut(e){
        e.preventDefault();
        inputDistance.value =  inputDuration.value =  inputCadence.value =  inputElevation.value =  '';
        const  { latlng : { lat , lng} } = this.#mapEvent;
        const popup = Leaflet.popup({
            maxWidth : 250,
            maxHeight : 100,
            autoClose : false,
            closeOnClick : false,
            className : "running-popup"
        });
        Leaflet.marker([lat , lng] , {icon: icon({
            iconUrl: 'marker-icon.3caa7cec.png',
            iconRetinaUrl: 'marker-icon.3caa7cec.png',
            shadowUrl: 'marker-shadow.5ac34ea4.png'
        })})
        .addTo(this.#map)
        .bindPopup(popup)
        .setPopupContent("Workout")
        .openPopup();
    }
    _handleError(err){
        console.log(err);
    }
}
const app = new App();