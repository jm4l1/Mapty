import Leaflet , {icon} from 'leaflet';
import { Cycling, Running } from './Workouts';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const clearAllWorkouts = document.querySelector('.clear_all');
const locationName = document.querySelector('.form__location');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

export default class App {
    #mapEvent;
    #map;
    #workouts = [];
    #location_name;
    constructor(){
        this._getPosition();
        this._loadLocalStorage();
        form.addEventListener('keydown', (e)=>{
            const { keyCode } = e;
            if(keyCode === 27){
                inputDistance.value =  inputDuration.value =  inputCadence.value =  inputElevation.value =  '';
                form.classList.add('hidden');
            }
        });
        form.addEventListener('submit' , this._newWorkOut.bind(this));
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        clearAllWorkouts.addEventListener('click',this.reset.bind(this));
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
        this.#workouts.forEach(workout=> this._renderWorkoutMarker(workout));
        function handleMapClick(e){
            this.#mapEvent = e;
            this._showForm();
            return;
        }
    }
    _showForm(){
        form.classList.remove('hidden');
        inputDistance.focus();
        const  { latlng : { lat , lng} } = this.#mapEvent;
        this._reverseGeoCode(lat , lng)
        .then(()=>{
            if(!this.#location_name){
                locationName.innerHTML = "📍 Unknown Location";
                return;
            }
            locationName.innerHTML = `📍 ${this.#location_name}`;
        });
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
    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl){
            return;
        }
        const workout = this.#workouts.find(workout=> workout.id === workoutEl.dataset.id);
        this.#map.setView(workout.coords,13 , {
            animate : true,
            pan : {
                duration : 1
            }
        });
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
            workout = new Running([lat,lng] , this.#location_name ,distance,duration,cadence);
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
            workout = new Cycling([lat,lng] , this.#location_name ,distance,duration,elevation);
        }
        
        //add workout to array
        this.#workouts.push(workout);

        //render on map
        this._renderWorkoutMarker(workout);

        //render in list
        this._renderWorkout(workout);
        //hide form + clear 
        this._hideForm();

        //set localstorage to all workouuts
        this._setLocalStorage(); 
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
    _loadLocalStorage(){
        let data  = [];
        data = JSON.parse(localStorage.getItem('workouts'));

        if(!data){
            return;
        }
        this.#workouts = data;
        this.#workouts.forEach(workout=>this._renderWorkout(workout));
    }
    _setLocalStorage(){
        localStorage.setItem('workouts' , JSON.stringify(this.#workouts));
    }
    _handleError(err){
        console.log(err);
    }
    reset(){
        if(this.#workouts.length === 0){
            return;
        }
        localStorage.removeItem('workouts');
        location.reload();
    }
    _reverseGeoCode(lat,lng){
        const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        return fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`)
        .then(response=>{
            return response.json();
        })
        .then(({results})=>{
            this.#location_name = results[0].formatted_address;
            return;
        })
        .catch(this._handleError)
    }
}