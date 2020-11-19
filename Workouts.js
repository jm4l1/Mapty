
import {v4 as uuidv4} from 'uuid';
class Workout{
    constructor(coords,locationName ,distance, duration){
        this.date = new Date();
        this.id = uuidv4();
        this.coords = coords;
        this.distance = distance; 
        this.duration = duration;
        this.locationName = locationName;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const info = this.locationName !== '' ? `in ${this.locationName}` : `on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${info}`;
    }
}
export class Running extends Workout{
    constructor(coords,locationName,distance, duration , cadence){
        super(coords,locationName,distance, duration);
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
export class Cycling extends Workout{
    constructor(coords,locationName,distance, duration , elevation){
        super(coords,locationName,distance, duration);
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