import $ from 'jquery';
import Common from './common';

class DriverCompare {

    constructor(service) {
        this.service = service;    
        this.common = new Common(this.service); 
        this.drivers = {};   
        this.driverCompareInfo = {};
        this.selected = {};
        this.subscriptions = [];
    }

    renderDropdown() {
        const drivers = Object.values(this.drivers);
        drivers.forEach(driver => {
            let driverMenu=$(`<option class="driver-dropdown-menu-item" value="${driver.id}">${driver.firstName} ${driver.lastName}</option>`);
            $('.driver-dropdown').append(driverMenu);                   
        });
        $('.selectpicker').selectpicker('refresh');
    }

    async initialize() {
        await this.getAllDrivers();
        this.renderDropdown();
        this.subscribe((event) => {
            if(event.type == "add") {
                this.addDriver(event.entity);
            }
            else if(event.type == "remove") {
                this.removeDriver(event.entity);
            }
        });
        $( ".selectpicker" ).change((e) => {
            var selected = $(e.currentTarget).selectpicker('val');    
            this.selectDrivers(selected);   
        });
    }

    async getAddresses(logRecords) {
        const coordinates = logRecords.map(record => ({
            x: record.longitude || 0,
            y: record.latitude || 0
        }));
        return this.service.api.call("GetAddresses", {
                "coordinates": coordinates,
                "movingAddresses":true
            }            
        );
    }

    async getDriverCompareInfo(drivers) {
        const today = (new Date()).toISOString();

        const dutyStatusLogsCall = this.service.api.multiCall(drivers.map(id=>{
            return ["Get", {
                typeName: "DutyStatusLog",
                search:
                {
                    UserSearch: { id: id },
                    fromDate: (new Date()).toISOString(),
                    statuses: ["D", "ON", "OFF", "SB", "YM", "PC", "WT"],
                    includeBoundaryLogs: true
                }
            }];
        }));
    
        const driverRegulationsCall = this.service.api.multiCall(drivers.map(id=>{
            return ["Get", {
                typeName:"DriverRegulation",
                search: {
                    userSearch: {
                        id: id
                    }
                }
            }];
        }));
    
        const LogRecordCall = this.service.api.multiCall(drivers.map(id=>{
            return ["Get", {
                "typeName":"LogRecord",
                "resultsLimit": 1,
                "search": {
                    "fromDate": today,
                    "toDate": today,
                    "deviceSearch": {
                        "id": id
                    }
                }
            }];
        }));

        const [dutyStatusLogs, driverRegulations, logRecords] = (await Promise.all([dutyStatusLogsCall,driverRegulationsCall, LogRecordCall])).map(o => o.map(this.common.reduceMultiCall));
        const addresses = await this.getAddresses(logRecords);
        
        driverRegulations.forEach(driverRegulation => {  
            if(!driverRegulation) driverRegulation = {};
            if(!driverRegulation.availability) driverRegulation.availability = {};
            if(!driverRegulation.availability.cycleAvailabilities) driverRegulation.availability.cycleAvailabilities = [];
              
            if(driverRegulation.availability.cycleAvailabilities[0]) {    
                const cycleAvailableTomorrow = driverRegulation.availability.cycleAvailabilities[0].available;
                driverRegulation.availability.availabilities.push({
                    duration: cycleAvailableTomorrow,
                    type: "Cycle Tommorrow"
                });
            }
        });

        drivers.forEach((id, index) => {
            this.driverCompareInfo[id] = {
                dutyStatusLog: dutyStatusLogs[index], 
                driverRegulation: driverRegulations[index], 
                logRecord: logRecords[index], 
                address: addresses[index]
            };
        });

        return this.driverCompareInfo;
    }

    async selectDrivers(selected) {
        const currentSelected = Object.keys(this.selected);
        const cached = Object.keys(this.driverCompareInfo);
        
        const added = this.common.getDifferences(selected, currentSelected);
        const removed = this.common.getDifferences(currentSelected, selected);
        const isNew = this.common.getDifferences(added, cached);
        
        removed.forEach(remove => {
            const entity = this.drivers[remove];
            entity.details = this.driverCompareInfo[remove];
            this.publish({
                type: "remove",
                entity: entity
            });
        });

        this.selected = this.common.convertArrayToObject(selected.map(id => this.drivers[id]), "id");

        await this.getDriverCompareInfo(isNew);

        added.forEach(add => {
            const entity = this.drivers[add];
            entity.details = this.driverCompareInfo[add];
            this.publish({
                type: "add",
                entity: entity
            });
        });

        return this.selected;        
    }

    async getAllDrivers() {
        const drivers = await this.service.api.call("Get",{
            "typeName":"User",
            "search":{
                "isDriver":true,
            }            
        });
        drivers.forEach((driver) => {
            this.drivers[driver.id] = driver;
        });
        return this.drivers;
    }

    subscribe(callback) {
        this.subscriptions.push(callback);
    }

    publish(event) {
        this.subscriptions.forEach(callback => {
            callback(event);
        });
    }

    getStatusBadge(status) {
        const STATUS_BACKGROUND = this.common.getStatusBackground();
        const badge = $(`<p id="current_status"></p>`);
        if(!status) {            
            badge.text("");        
            badge.removeClass("available_status");            
            badge.css("background","initial");
        } else {
            const background = STATUS_BACKGROUND[status] || STATUS_BACKGROUND.default;
            badge.text(status);
            badge.addClass("available_status");      
            badge.css("background", background);
        }
        return badge[0].outerHTML;
    }

    getDriverCard(driver) {
        let initials = `${driver.firstName.charAt(0)}${driver.lastName.charAt(0)}`;
        let status = this.getStatusBadge(driver.details.dutyStatusLog.status);
        let currentStautusDuration = this.common.getStatusDuration(driver.details.dutyStatusLog.dateTime);
        let availabilityCards = this.common.getAvailabilityCards(driver.details.driverRegulation.availability.availabilities).map(o => o[0].outerHTML).join("");
        let card = $(`
            <div class="container" id="compare_card_${driver.id}">
                <div class="card">
                <div class="card-body">
                    <div class="row justify-content-start">
                        <div class="col-2 p-0 pl-3"><span class="avatar avatar-32 bg-primary text-white rounded-circle">${initials}</span>
                        </div>
                        <div class="col-8 p-0 text-center">
                            <h5>${driver.firstName} ${driver.lastName}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${driver.details.address.formattedAddress}</h6>
                        </div>
                        <div class="col-2 p-0 pr-2 text-center">
                            ${status}
                        </div>
                        </div>
                        <div class="row justify-content-center">
                        <button type="button" class="btn btn-primary mr-3" id="message_driver"}>Message</button>
                        <a type="button" class="btn btn-danger ml-3" id="call_driver">Phone</a> 
                        </div>
                        <br>
                        <p class="mb-1" id="driver_availability"></p>
                        <div class="justify-content-start card-columns" id="driver_availability_card">
                            ${availabilityCards}
                        </div>
                    </div>
                    <div class="alert alert-secondary" role="alert">
                    ${currentStautusDuration? `Driver has been ${driver.details.dutyStatusLog.status} For ${currentStautusDuration}!` : "Duty Status not available!"}
                    </div>
                </div>
            </div>  
        `);

        return card;
    }

    addDriver(driver) {
        let card = this.getDriverCard(driver);
        console.log(card);
        $('#driversearches').prepend(card);
    }

    removeDriver(driver) {
        let card = $(`#compare_card_${driver.id}`);
        console.log(card);
        card.remove();
    }

    async listDrivers(driverName) {
        const driverInformation = await getAllDriversInfo(driverName);        
        for(let i=0;i<driverInformation.length;i++){
            let textStatus = driverInformation[i].dutyStatus ? driverInformation[i].dutyStatus.status : "NO_STATUS";
            let status = textStatus == 'NO_STATUS' ? '': getCurrentStatusBadge(textStatus)[0].outerHTML;
            let address = driverInformation[i].address?driverInformation[i].address:"Unknown";
            let initials = driverInformation[i].firstName.charAt(0)+driverInformation[i].lastName.charAt(0);
            let currentStautusDuration = driverInformation[i].dutyStatus?(getStatusDuration(driverInformation[i].dutyStatus.dateTime)):false;
            
                        
            $('#driversearches').append(card);
            if(driverInformation[i].availability) {
                setCardAvailability(card, driverInformation[i].availability);
            } else {
                card.find('#driver_availability_card').text("User is on no ruleset");
            }            
            card.find("#message_driver").click(() => gotoMessagePage(driverInformation[i].id));
            card.find("#call_driver").attr('href', `tel:${driverInformation[i].phoneNumber}`);
         
        }

    }

}

export default DriverCompare = DriverCompare;