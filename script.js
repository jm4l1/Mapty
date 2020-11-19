'use strict';
import Leaflet , {icon} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {v4 as uuidv4} from 'uuid';

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
    #workouts = [];
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
    _hideForm(){
        inputDistance.value =  inputDuration.value =  inputCadence.value =  inputElevation.value =  '';
        form.style.display ='none';
        form.classList.add('hidden');
        setTimeout(()=> form.style.display ='grid',100);

    }
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkOut(e){
        e.preventDefault();

        const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
        const allPositve = (...inputs) => inputs.every(input => input > 0);
        //get form data
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const  { latlng : { lat , lng} } = this.#mapEvent;
        let workout;
        //if running
        if (type === "running"){
            const cadence = +inputCadence.value;
            //validate data
            if (
                !validInputs(distance, duration, cadence) || 
                !allPositve(distance, duration, cadence)
                )
            {
                return alert("Inputs Have to be positive numbers");
            }
            workout = new Running([lat,lng],distance,duration,cadence);
        }

        //if cycling
        if (type === "cycling"){
            const elevation = +inputElevation.value;
            //validate data
            if (
                !validInputs(distance, duration, elevation) || 
                !allPositve(distance, duration)
                )
            {
                return alert("Inputs Have to be positive numbers");
            }
            workout = new Cycling([lat,lng],distance,duration,elevation);
        }
        
        //add workout to array
        this.#workouts.push(workout);

        //render on map
        this._renderWorkoutMarker(workout);

        //render in list
        this._renderWorkout(workout);
        //hide form + clear 
        this._hideForm();
        // inputDistance.value =  inputDuration.value =  inputCadence.value =  inputElevation.value =  '';
    }
    _renderWorkoutMarker(workout){
        const popup = Leaflet.popup({
            maxWidth : 250,
            maxHeight : 100,
            autoClose : false,
            closeOnClick : false,
            className : `${workout.type}-popup`
        });
        Leaflet.marker(workout.coords , {icon: icon({
            iconUrl: 'marker-icon.3caa7cec.png',
            iconRetinaUrl: 'marker-icon.3caa7cec.png',
            shadowUrl: 'marker-shadow.5ac34ea4.png'
        })})
        .addTo(this.#map)
        .bindPopup(popup)
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }
    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if(workout.type === 'running'){
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        `;
        }
        if(workout.type === 'cycling'){
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevation}</span>
                <span class="workout__unit">m</span>
            </div>
            `;
        }
        html += '</li>';
        form.insertAdjacentHTML('afterend',html);
    }
    _handleError(err){
        console.log(err);
    }
}
class Workout{
    constructor(coords,distance, duration){
        this.date = new Date();
        this.id = uuidv4();
        this.coords = coords;
        this.distance = distance; 
        this.duration = duration;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
class Running extends Workout{
    constructor(coords,distance, duration , cadence){
        super(coords,distance, duration);
        this.type = "running";
        this.cadence = cadence;
        this._calcPace();
        this._setDescription();
    }
    _calcPace(){
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}
class Cycling extends Workout{
    constructor(coords,distance, duration , elevation){
        super(coords,distance, duration);
        this.type = "cycling";
        this.elevation = elevation;
        this._calcSpeed();
        this._setDescription();
    }
    _calcSpeed(){
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}
const app = new App();

