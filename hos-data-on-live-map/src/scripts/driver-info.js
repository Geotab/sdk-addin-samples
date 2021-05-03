import $ from 'jquery';
import Common from './common';

class DriverInfo {

    constructor(service) {
        this.service = service;    
        this.common = new Common(this.service);    
    }

    updateDriverInfoError({
        device_name = "",
        trailer_attached = "",
        driver_availability_table = "",
        details = "No Driver Change object returned",
        malfunctions = "No malfunction information available",
        driver_availability = "No Availability information available",
        active_violation = "No violation information available",
        current_status = "No Current Status Information Available",
        daily_Summaries = "No Daily Summary Information Available",
        shipment_attached = "No Active Shipments",
        available_exemptions = "No Exemption Information Available",
        ruleset = "No Ruleset Information Available",
        dvir = "No DVIR Information Available",
        reset = true
    }) {
        this.updateDriverInfo({
            device_name,
            trailer_attached,
            driver_availability_table,
            details,
            malfunctions,
            driver_availability,
            active_violation,
            current_status,
            daily_Summaries,
            shipment_attached,
            available_exemptions,
            ruleset,
            dvir,
            reset,
        });
    }

    updateDriverInfo({
        device_name,
        trailer_attached,
        details,
        driver_availability_table,
        malfunctions,
        driver_availability,
        active_violation,
        current_status,
        daily_Summaries,
        shipment_attached,
        available_exemptions,
        ruleset,
        dvir,
        reset = false,
    }) {
        const STATUS_BACKGROUND = this.common.getStatusBackground();
        if(device_name) $("#device_name").html(device_name);
        if(trailer_attached) $("#trailer_attached").html(trailer_attached);
        if(details) $("#driver_details").html(details);                
        if(malfunctions) $("#malfunctions").html(malfunctions);        
        if(driver_availability) $("#driver_availability").html(driver_availability);       
        if(active_violation) $("#active_violation").html(active_violation);        
        if(current_status) $("#current_status").html(current_status);        
        if(daily_Summaries) $("#daily_Summaries").html(daily_Summaries);        
        if(shipment_attached) $("#shipment_attached").html(shipment_attached);        
        if(available_exemptions) $("#available_exemptions").html(available_exemptions);
        if(ruleset) $("#current_ruleset").html(ruleset);
        if(driver_availability_table) $("#driver_availability_table").html(driver_availability_table);
        if(dvir) $("#dvir").html(dvir);

        if(current_status) {
            const background = STATUS_BACKGROUND[current_status] || STATUS_BACKGROUND.default;
            $("#current_status").css("background", background);
            $("#current_status").addClass("available_status");  
        }

        if(reset) {
            $("#hos_data_view_logs_button").attr("hidden", "");         
            $("#current_status").removeClass("available_status");        
            $("#current_status").css("background", "initial");
        }
    }

    handleDriverPullError(err) {
        if(err.message == 'UnknownDriverId')
            this.updateDriverInfoError({
                details: "No Driver assigned to the vehicle"
            });
        else if(err.message == 'NoDriverChangeRecord') 
            this.updateDriverInfoError({
                details: "No Driver assigned to the vehicle"
            });
        else throw err;
    }

    async getDeviceInformation(deviceId) {
        const currentDate = new Date().toISOString();
        const currentMidnight = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const nextMidnight = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
        const lastWeek = new Date(new Date().setHours(-168, 0, 0, 0)).toISOString(); // last 7 days
        const DiagMalflogStatuses = this.common.getDiagMalflogStatuses();

        const [changeInfo, device, DVIRInfo, deviceDutyStatusLog, shipmentLog, trailerAttachments] = (await this.service.api.multiCall([
            ["Get", {
                "typeName": "DriverChange",
                "search":
                {
                    deviceSearch: { id: deviceId },
                    fromDate: currentDate,
                    toDate: currentDate,
                    includeOverlappedChanges: true
                }
            }],

            ["Get", {
                typeName: "Device",
                search: {
                    id: deviceId,
                }
            }],

            ["Get", {
                "typeName": "DVIRLog",
                "search": {
                    fromDate: currentDate,
                    includeBoundaryLogs: true,
                    deviceSearch: { id: deviceId }
                },
                "resultsLimit": 1
            }],

            ["Get", {
                "typeName": "DutyStatusLog",
                "search": {
                    deviceSearch: { id: deviceId },
                    statuses: DiagMalflogStatuses,
                    fromDate: lastWeek,
                    toDate: currentDate,
                    includeBoundaryLogs: true
                }
            }],

            ["Get", {
                typeName: "ShipmentLog",
                search: {
                    deviceSearch: { id: deviceId },
                    fromDate: currentMidnight,
                    toDate: nextMidnight
                }
            }],

            ["Get", {
                typeName: "TrailerAttachment",
                search: {
                    deviceSearch: { id: deviceId },
                    activeFrom: currentDate,
                    activeTo: currentDate
                }
            }]

        ])).map(this.common.reduceMultiCall);

        try {
            if(!changeInfo)
                throw new Error("NoDriverChangeRecord");
            if(changeInfo.driver == "UnknownDriverId")
                throw new Error("UnknownDriverId");
        } catch(err) {
            this.handleDriverPullError(err);
        }

        return {changeInfo, device, DVIRInfo, deviceDutyStatusLog, shipmentLog, trailerAttachments};
    }

    async getDriverInformation(driverId) {
        const currentDate = new Date().toISOString();
        const [driverRegulation, dutyStatusLog, driver] = (await this.service.api.multiCall([
            ["Get", {
                "typeName": "DriverRegulation",
                "search": {
                    "userSearch": { "id": driverId }
                }
            }],

            ["Get", {
                typeName: "DutyStatusLog",
                search:
                {
                    UserSearch: { id: driverId },
                    fromDate: currentDate,
                    statuses: ["D", "ON", "OFF", "SB", "YM", "PC", "WT"],
                    includeBoundaryLogs: true
                }
            }],

            ["Get", {
                typeName: "User",
                search: {
                    id: driverId,
                }
            }]            

        ])).map(this.common.reduceMultiCall);      
        return {driverRegulation, dutyStatusLog, driver};
    }

    async getTrailers(trailerAttachments) {
        if(!trailerAttachments) return {
            trailers: []
        };
        if(!trailerAttachments.map) trailerAttachments = [trailerAttachments];
        return {
            trailers: (await this.service.api.multiCall(trailerAttachments.map(att => {
                return ["Get", {
                    "typeName": "Trailer",
                    "search": {
                        id: att.trailer.id
                    }
                }];
            }))).map(this.common.reduceMultiCall)
        };
    }

    getAvailableExemptions(driver, regulations) {
        const availableExemptionsArray = [];

        console.log(regulations);

        if (regulations.length > 0) {
            regulations.forEach((regulation) => {
                if (regulation.availability.is16HourExemptionAvailable === true) {
                    availableExemptionsArray.push("16 Hour Exemption");
                }
                if (regulation.availability.isAdverseDrivingExemptionAvailable === true) {
                    availableExemptionsArray.push("Adverse Driving Conditions");
                }
            });
        }        

        if (driver.isPersonalConveyanceEnabled === true) {
            availableExemptionsArray.push("Personal Conveyance");
        }
        if (driver.isYardMoveEnabled === true) {
            availableExemptionsArray.push("Yard Move");
        }
        if (driver.isExemptHOSEnabled === true) {
            availableExemptionsArray.push("Hos Exempt");
        }

        return availableExemptionsArray.join("<br/>");
    }

    getTrailerNames(trailers) {
        return trailers ? trailers.map(t => t.name).join(", ") + "-" : null;
    }

    getShipmentInfo(shipmentInfo) {
        if(!shipmentInfo) return;
        var shippingListFinal = [];

        for (var i = 0; i < shipmentInfo.length; i++) {
            
            var shippingListInitial = [];
            if (shipmentInfo[i].commodity.length > 0) {
                shippingListInitial.push("Commodity: " + shipmentInfo[i].commodity);
            }
            if (shipmentInfo[i].documentNumber.length > 0) {
                shippingListInitial.push("Document Number: " + shipmentInfo[i].documentNumber);
            }
            if (shipmentInfo[i].shipperName.length > 0) {
                shippingListInitial.push("Shipper Name: " + shipmentInfo[i].shipperName);
            }
            shippingListFinal.push(shippingListInitial.join(" | "));
        }

        if (shippingListFinal.length > 0) {
            return shippingListFinal.map((s, i) => (i + 1) + ") " + s).join("<br/>");
        } else return "No Active Shipments";
    }

    getDeviceMalfunctions(logList) {
        const malfunctionDiagnosticResult = logList.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        const activeMalfunctionList = this.common.getLatestMalfunctionDiagnosticLog(malfunctionDiagnosticResult);

        return activeMalfunctionList.length === 0 ?
            "No Active Malfunctions" :
            activeMalfunctionList.join("<br/>");
    }

    getViolationInfo(driverRegulation) {        
        var violations = (driverRegulation.violations || [])
            .filter(v => !!v.toDate)
            .map(v => {
                var vt = new Date(v.fromDate);
                return v.type + " violation: " + (vt.getMonth() + 1) + "/" + vt.getDate() + " " + vt.getHours() + ":" + vt.getMinutes();
            })
            .join("<br/>");

        if (violations.length > 0) {            
            return violations;
        } else {
            return "No active violations!";
        }
    }

    getAvailabilityCards(availabilities) {
        return availabilities.map(availability => {
            return this.common.getAvailabilityCard(availability.type, availability.duration);
        });
    }
    displayDriverAvailability(driverRegulation) {
        const availabilityCards = [];
        var availabilityArrayDuration = [];
        var currentTotalTime;
        var previousTotalTime;
        var index;  
        if (!driverRegulation) {            
            return "User is on no ruleset";
        } else if (driverRegulation.availability.availabilities.length == 0) {            
            return "User is on no ruleset";
        } else {                        
            var cycleAvailableTomorrow = driverRegulation.availability.cycleAvailabilities[0].available;
            driverRegulation.availability.availabilities.push({
                duration: cycleAvailableTomorrow,
                type: "Cycle Tommorrow"
            });
            for (var j = 0; j < driverRegulation.availability.availabilities.length; j++) {
                var availabilityType = driverRegulation.availability.availabilities[j].type;
                var availabilityDuration = driverRegulation.availability.availabilities[j].duration;
                availabilityArrayDuration.push(this.common.formatDuration(availabilityDuration));

                console.log(availabilityType,availabilityDuration);
                let card = this.common.getAvailabilityCard(availabilityType,availabilityDuration);
                availabilityCards.push(card);
                //Find out the position (index) of the availability type with the lowest duration
                var hours = parseInt(availabilityArrayDuration[j].split(" ")[0].split("h")[0], 10);
                var minutes = parseInt(availabilityArrayDuration[j].split(" ")[1].split("m")[0], 10);
                currentTotalTime = hours * 60 + minutes;
                if (j === 0) {
                    previousTotalTime = currentTotalTime;
                    index = j;
                } else {
                    if (currentTotalTime < previousTotalTime && currentTotalTime > 0) {
                        previousTotalTime = currentTotalTime;
                        index = j;
                    }
                }
            }
        }        

        return availabilityCards.map(card => card[0].outerHTML).join("");

        if (previousTotalTime <= 120 && previousTotalTime > 60) {
            this.showAvailabilityWarningIcon(index, "green_availability_warning", "The driver is approaching violation in 2 hours or less.");
        } else if (previousTotalTime <= 60 && previousTotalTime > 30) {
            this.showAvailabilityWarningIcon(index, "yellow_availability_warning", "The driver is approaching violation in 1 hour or less.");
        } else if (previousTotalTime <= 30 && previousTotalTime > 0) {
            this.showAvailabilityWarningIcon(index, "red_availability_warning", "The driver is approaching violation in 30 minutes or less.");
        } else if (previousTotalTime === 0) {
            this.showAvailabilityWarningIcon(index, "red_availability_warning", "The driver has no availability");
        }
    }

    getDailySummaries(driverRegulation) {     

        if (driverRegulation.hasOwnProperty("daySummaries")) {
            var currentDaySummaries = driverRegulation.daySummaries[driverRegulation.daySummaries.length - 1];
            var dailySummaryArray = [];

            if (currentDaySummaries.hasOwnProperty("driveTotal")) {
                dailySummaryArray.push("Daily Driving Total: " + this.common.formatDuration(currentDaySummaries.driveTotal));
            }

            if (currentDaySummaries.hasOwnProperty("offTotal")) {
                dailySummaryArray.push("Daily Off Total: " + this.common.formatDuration(currentDaySummaries.offTotal));
            }

            if (currentDaySummaries.hasOwnProperty("onTotal")) {
                dailySummaryArray.push("Daily On Total: " + this.common.formatDuration(currentDaySummaries.onTotal));
            }

            if (currentDaySummaries.hasOwnProperty("sleeperBerthTotal")) {
                dailySummaryArray.push("Daily Sleeper Berth Total: " + this.common.formatDuration(currentDaySummaries.sleeperBerthTotal));
            }           

            return dailySummaryArray.join("<br/>");
        } else {            
            return "No Daily Summary Information Available";
        }
    }

    displayDriverInfo({driver, driverRegulation, dutyStatusLog})  {       
        this.updateDriverInfo({
            details: `${driver.name} ${driver.lastName}`,
            ruleset: driver.hosRuleSet,
            current_status: dutyStatusLog.status,
            available_exemptions: this.getAvailableExemptions(driver, driverRegulation),
            driver_availability_table: this.displayDriverAvailability(driverRegulation),
            daily_Summaries: this.getDailySummaries(driverRegulation),
            active_violation: this.getViolationInfo(driverRegulation)
        });
    }

    displayDeviceInfo({device, trailers, shipmentLog, deviceDutyStatusLog})  {       
        this.updateDriverInfo({
            device_name: device.name,
            trailer_attached: this.getTrailerNames(trailers),
            shipment_attached: this.getShipmentInfo(shipmentLog),
            malfunctions: this.getDeviceMalfunctions(deviceDutyStatusLog)
        });
    }

    displayDVIRInfo(DVIRInfo) {    
        const getDVIRMessage = (DVIRInfo) => {
            if (DVIRInfo.hasOwnProperty("certifyDate") && DVIRInfo.hasOwnProperty("repairDate")) {                    
                return "Most recent DVIR log for this vehicle was repaired and certified";
            } else if (!DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                return "Most recent DVIR log for this vehicle has no defects";
            } else if (!DVIRInfo.hasOwnProperty("defects") && DVIRInfo.hasOwnProperty("certifyDate")) {
                return "Most recent DVIR log for this vehicle has no defects and was certified";
            } else if (DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("repairDate")) {
                return "Most recent DVIR log for this vehicle has defects but are not repaired";
            } else if (DVIRInfo.hasOwnProperty("repairDate") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                return "Most recent DVIR log for this vehicle has defects which are repaired but not certified";
            } else return;
        };           
        this.updateDriverInfo({
            dvir: getDVIRMessage(DVIRInfo)
        });
    }

    displayInformation({device, DVIRInfo, driver, driverRegulation, dutyStatusLog, shipmentLog, trailers, deviceDutyStatusLog}) {
        this.displayDeviceInfo({device, trailers, shipmentLog, deviceDutyStatusLog});
        this.displayDriverInfo({driver, driverRegulation, dutyStatusLog});
        this.displayDVIRInfo(DVIRInfo);
    }

    async getComplianceInfo(deviceId) {  
        this.createDriverButtons(deviceId); 
        try {
            const deviceInformation = await this.getDeviceInformation(deviceId);
            const driverInformationCall = this.getDriverInformation(deviceInformation.changeInfo.driver.id);
            const trailerInformationCall = this.getTrailers(deviceInformation.trailerAttachments);
            
            const [trailerInformation, driverInformation] = await Promise.all([trailerInformationCall, driverInformationCall]);
            this.displayInformation({
                ...deviceInformation,
                ...driverInformation,
                ...trailerInformation
            });
        } catch(err) {
            this.handleDriverPullError(err);
        }

    } 

    createDriverButtons(driverId) {
        const now = new Date();
        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());        
        this.common.createMenuItems([{
            id: "sendMessage",
            text: "Send Message",
            callback: (e) => {
                this.common.gotoMessagePage(driverId);
            }
        }, {
            id: "viewOneDayLog",
            text: "View Logs(1 Days)",
            callback: (e) => {    
                const start = nowDate;
                const end = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
                this.common.goToHOSPage(driverId, start.toISOString(), end.toISOString());
            }
        }, {
            id: "viewSevenDayLog",
            text: "View Logs(7 Days)",
            callback: (e) => {    
                const start = new Date(nowDate.getTime() - (24 * 60 * 60 * 1000 * 7));
                const end = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
                this.common.goToHOSPage(driverId, start.toISOString(), end.toISOString());
            }
        }]);       
    }

    initiateMapEvents() {
        this.common.attachEvent('events', 'device', 'click', (data) => this.getComplianceInfo(data.entity.id));
        this.common.attachMenuEvent('Display HOS data', 'vehicleMenu', 'Clicked', (data) => this.getComplianceInfo(data.device.id));
    }
    
}

export default DriverInfo = DriverInfo;