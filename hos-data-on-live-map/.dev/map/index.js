import $ from 'jquery';

class map {
  constructor() {
    this.template = $(`<div class="map-functions"></div>`);
    this.initiateEvents();
  }
  
  initiateEvents() {
    global.events.on('actionListAttach', (e, callback) => this.actionListAttach(e, callback))
    global.events.on('actionListAttachMenu', (e, callback) => this.actionListAttachMenu(e, callback))    
  }
  
  createVehicleMenu(e) {
    let item = e.callback();
    item.then((itemresults) => {
      itemresults= itemresults[0];
      let menu = $(`
        <form>
          <div class="form-container">
            <h6>${itemresults.title}</h6>
            <div class="textfield">
        			<input name="driver_id" type="text" value="b14">
        			<label>Driver ID</label>
        		</div>
            <div class="textfield" style="display:block">
              <input type="submit" value="Send Event">
            </div>
          </div>
        </form>
      `);
      $(menu).submit(function(ev) {
        console.log(ev);
        ev.preventDefault();
        global.events.emit(itemresults.clickEvent, {
          "x": 402,
          "y": 402,
          "menuName": "vehicleMenu",
          "location": {
            "lat": 43.70495651999872,
            "lng": -79.83887479999999
          },
          "device": {
            "id": ev.target[0].value
          }
        })
      })
      this.template.append(menu);
    });
  }
  
  actionListAttach(e) {
    console.log("actionListAttach", e);
  }
  
  actionListAttachMenu(e) {
    if(e.menuId == 'vehicleMenu') {
      this.createVehicleMenu(e);
    }
    console.log("actionListAttachMenu", e);
  }
  
  addForm() {
    this.template.append(`
      <form>
        <fieldset>
          <label for="select-choice">Transformers fan?</label>
          <select name="select-choice" id="select-choice">
            <option value="Choice 1">- - select one - -</option>
            <option value="Choice 2">Yes!</option>
            <option value="Choice 3">They're kinda cool, yeah.</option>
            <option value="Choice 4">Meh... not really.</option>
            <option value="Choice 5">What's Transformers?</option>
          </select>
        </fieldset>
        <button class="form-button">Submit</button>
      </form>
    `);
  }
}

export const Map = map;
