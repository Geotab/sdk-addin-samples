
import "../styles/index.scss";
import $ from 'jquery';
import 'bootstrap';

//import "../styles/dropdown.scss";
// eslint-disable-next-line no-undef

geotab.addin.request = (elt, service) => {

    var DiagMalflogStatuses = [
        "PowerCompliance", "EngineSyncCompliance", "DataTransferCompliance", "PositioningCompliance", "TimingCompliance",
        "DataRecordingCompliance", "MissingElementCompliance", "UnidentifiedDrivingCompliance"
    ];

    var driverInfo = {
        driverName: "",
        deviceName: "",
        trailerName: ""
    };

    

    function getAllDriversInfo(){
        let drivers = {};
        return new Promise((resolve, reject) => {
            service.api.call("Get",{
                "typeName":"User",
                "search":{
                    "isDriver":true,
                }
            
            }).then(results =>{
                results.filter(s => s).forEach(driver => {
                    drivers[driver.id] = driver;                    
                });                
                let dutyStatusLogs = service.api.multiCall(results.map(driver=>{
                    return ["Get", {
                        typeName: "DutyStatusLog",
                        search:
                        {
                            UserSearch: { id: driver.id },
                            fromDate: (new Date()).toISOString(),
                            statuses: ["D", "ON", "OFF", "SB", "YM", "PC", "WT"],
                            includeBoundaryLogs: true
                        }
                    }];
                }));
            
                let driverRegulations = service.api.multiCall(results.map(driver=>{
                    return ["Get", {
                        typeName:"DriverRegulation",
                        search: {
                            userSearch: {
                                id: driver.id
                            }
                        }
                    }];
                }));
            
                Promise.all([dutyStatusLogs,driverRegulations])
                .then(async function(result){
                    var dutyStatusResults = result[0];
                    let dutyStatus = dutyStatusResults.map(s => s[0]);
                    
                    //let deviceIds =  dutyStatusResults.map(s => s[0]).map(dutyStatus=>dutyStatus?dutyStatus.device.id:"No_Device");
                    let deviceIds =  dutyStatusResults.filter(s => s).map(s => s[0]).map(dutyStatus=>dutyStatus && (dutyStatus.device!="NoDeviceId")?dutyStatus.device.id:"NoDeviceId");
                    let addresses = await getAddresses(deviceIds);
                    var driverRegulationsResult=result[1];
                    let driverAvailability = driverRegulationsResult.map(s =>s[0]);
                    driverAvailability.filter(s => s).forEach(value => {
                        const id = value.availability.driver.id;
                        drivers[id].availability = value;
                    });
                    dutyStatus.filter(s => s).forEach((value, i) => {
                        const id = value.driver.id;
                        drivers[id].dutyStatus = value;
                        drivers[id].address = addresses[i];
                    });
                    resolve(Object.values(drivers));
                });
            });
        });
    };

    async function getAddresses (deviceIds){
        return new Promise((resolve, reject) => {
            const today = (new Date()).toISOString();

            service.api.multiCall(deviceIds.map(id =>{
                return [
                    "Get", {
                        "typeName":"LogRecord",
                        "resultsLimit": 1,
                        "search": {
                            fromDate: today,
                            toDate: today,
                            "deviceSearch": {
                                "id": id
                            }
                        }
                    }];
            }))
            .then(results =>{
                let logRecords = results.map(s =>s[0]).map(result=>result?
                    ({
                        x:result.longitude,y:result.latitude
                    }):({
                    x:0,y:0 
                    }));
                console.log("Log",logRecords);
                service.api.multiCall(logRecords.map(coords=>{
                    return [
                        "GetAddresses", {
                            "coordinates":[coords],
                            "movingAddresses":true
                        }];
                }))
                .then(addresses=>{
                    let address=addresses.map(s=>s[0]).map(address=>(address.country!="Unknown")?address.formattedAddress:"Unknown");
                    resolve(address);
                });
            });
        });
    }

    
    createTransferLog();
    compareDriver();

    function createDriverButtons(driverId) {
        var now = new Date();
        var nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var end = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
        createSeperator();
        createMenuItem("sendMessage", "Send Message", (e) => {
            gotoMessagePage(driverId);
        });
        createMenuItem("viewOneDayLog", "View Logs(1 Day)", (e) => {    
            var start = nowDate;
            gotoHOSPage(driverId, start.toISOString(), end.toISOString());
        });
        createMenuItem("viewSevenDayLog", "View Logs(7 Days)", (e) => {    
            var start = new Date(nowDate.getTime() - (24 * 60 * 60 * 1000 * 7));
            gotoHOSPage(driverId, start.toISOString(), end.toISOString());
        });        
    }

    function createTransferLog() {
        createMenuItem("transferLogs", "Transfer Logs", (e) => {
            gotoTransferPage();
        });
    }

    function getCurrentStatusBadge(currentStatus) {
        var currStatusElt = $(`<p id="current_status"></p>`);

        if (!currentStatus) {
            
            currStatusElt.text("No Current Status Information Available");
        
            currStatusElt.removeClass("available_status");
            
            currStatusElt.css("background","initial");
            return;
        }
      
        currStatusElt.addClass("available_status");
        
        currStatusElt.text(currentStatus);

        if (currentStatus === "OFF") {         
            currStatusElt.css("background","#888888");
        } else if (currentStatus === "SB") {
            currStatusElt.css("background","#E95353");
        } else if (currentStatus === "D") {
            currStatusElt.css("background","#48BB48");
        } else if (currentStatus === "ON") {
            currStatusElt.css("background","#FFA500");
        } else if (currentStatus === "YM") {
            currStatusElt.css("background","#FFA500");
        } else {
            currStatusElt.css("background","#888888");
        }
        return currStatusElt;
    }


    async function listDrivers() {
        const driverInformation = await getAllDriversInfo();        
        for(let i=0;i<driverInformation.length;i++){
            let availabilityCard = $(`
            <div class="card text-center avalability-card">
                <div class="card-body">
                    <h5 class="card-title" id="driver_availability_heading">
                    </h5>
                    <p class="card-text" id="driver_availability_body">
                    </p>
                </div>
            </div>
        `);
            let status = getCurrentStatusBadge(driverInformation[i].dutyStatus ? driverInformation[i].dutyStatus.status : "NO_STATUS")[0].outerHTML;
            let address = driverInformation[i].address?driverInformation[i].address:"Unknown";
            
            let card = $(`
            <div class="container">
            <div class="card">
              <div class="card-body">
                <div class="row justify-content-start">
                  <div class="col-2 p-0 pl-3"><span class="avatar avatar-32 bg-primary text-white rounded-circle">DN</span>
                  </div>
                  <div class="col-8 p-0 text-center">
                      <h5>${driverInformation[i].firstName} ${driverInformation[i].lastName}</h5>
                      <h6 class="card-subtitle mb-2 text-muted">${address}</h6>
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
                </div>
                </div>
                <div class="alert alert-secondary" role="alert">
                  A simple primary alert—check it out!
                </div>
              </div>
            </div>  
            `);            
            $('.addin-driver-compare').append(card);
            card.find("#message_driver").click(() => gotoMessagePage(driverInformation[i].id));
            card.find("#call_driver").attr('href', `tel:${driverInformation[i].phoneNumber}`);
            card.find('#driver_availability_card').append(availabilityCard);
            
        }
        console.log(driverInformation);
    }

    function compareDriver(){
        createMenuItem("compare-driver","Compare Driver",(e)=>{
            $(".addin-driver-info").attr("hidden","");
            $(".addin-driver-compare").removeAttr("hidden");
            listDrivers();
        });
    }

    function deleteMenuItems() {
        $('.dropdown-menu').html("");
        createTransferLog();
        compareDriver();
    }

    function createSeperator() {
        
        var menuItem = $(`<li><hr class="dropdown-divider"></li`);

        $('.dropdown-menu').append(menuItem);
    };

    function createMenuItem(id, text, callback) {

        var menuItem=$(`<li><button class="dropdown-item" type="button" id="${id}">${text}</button></li>`);

        $('.dropdown-menu').append(menuItem);

        return menuItem.find("button").click((e) => {
            callback(e);
        },);
        
    };
    

    function gotoTransferPage() {
        service.page.go("transferEld", {});
    }

    function gotoMessagePage(driverId) {
        service.page.go("messages", {
            chatWith: {
              devices: [],
              users: [driverId]
            },
            isNewThread: false
          });
    };

    function availabilityCard(availabilityType,availabilityDuration){
        console.log("Availabilties:",availabilityType,availabilityDuration);

        let card = $(`
            <div class="card text-center avalability-card">
                <div class="card-body">
                    <h5 class="card-title" id="driver_availability_heading">
                    </h5>
                    <p class="card-text" id="driver_availability_body">
                    </p>
                </div>
            </div>
        `);

        card.find("#driver_availability_heading").append(availabilityIcons(availabilityType));
        card.find("#driver_availability_body").append(formatDuration(availabilityDuration));

        $('#driver_availability_table').append(card);

    };

    function availabilityIcons(availabilityType){
        var html;
        console.log(availabilityType);
       switch(availabilityType){
            case "Rest":
                html=$(`<svg class="svgIcon hos-avail__header-icon" aria-label="The time remaining before the driver is required to rest." focusable="false">
                <title>The time remaining before the driver is required to rest.</title>
                <svg viewBox="0 0 32 32" id="geo-coffee"><path d="M3.305 10.08q0-1.488.988-2.513.989-1.025 2.348-1.025h1.081v7.078H6.641q-1.39 0-2.348-1.025-.957-1.026-.988-2.514zM32 24.27H1.112q0 1.952 1.297 3.34Q3.707 29 5.53 29h22.054q1.822 0 3.12-1.39Q32 26.223 32 24.27zM0 10.08q0 2.945 1.946 5.028 1.946 2.084 4.695 2.051h1.081v.595q0 1.72 1.143 2.911 1.143 1.19 2.718 1.224h12.139q1.575 0 2.718-1.224t1.143-2.91V4.192q0-.496-.34-.86-.34-.363-.772-.33H6.641q-2.75 0-4.695 2.084Q0 7.17 0 10.08z"></path></svg>
                </svg>`);
            break;
            case "Duty":
                html=$(`<svg class="svgIcon hos-avail__header-icon" aria-label="The ON duty and Drive time remaining for the driver. This is a non-consecutive limit." focusable="false">
                <title>The ON duty and Drive time remaining for the driver. This is a non-consecutive limit.</title>
                <svg viewBox="0 0 32 32" id="geo-briefcase"><path d="M32 32v-9.247H17.568v2.913h-3.136v-2.913H0V32zm0-12.086V5.134h-8.512V0H8.512v5.133H0v14.78h14.432v-3.057h3.136v3.058zM21.184 5.134H10.816V2.657h10.368z"></path></svg>
            </svg>`);
            break;
            case "Driving":
                html=$(`<svg class="svgIcon hos-avail__header-icon" aria-label="The driving time remaining for the driver." focusable="false">
                <title>The driving time remaining for the driver.</title>
                <svg viewBox="0 0 32 32" id="geo-steering-wheel"><path d="M15.982.004q-6.593 0-11.288 4.688Q0 9.381 0 16.002q0 6.62 4.694 11.273 4.695 4.652 11.288 4.724 6.593.072 11.323-4.724T32 16.002q-.036-6.478-4.695-11.31Q22.647-.139 15.982.004zm0 4.008q3.834 0 6.916 2.22 3.082 2.218 4.372 5.761H4.73Q6.02 8.45 9.102 6.231q3.082-2.219 6.88-2.219zm.036 13.958q-.86 0-1.47-.573-.609-.572-.573-1.431 0-.86.61-1.432.609-.572 1.397-.572t1.397.572q.61.573.61 1.432t-.61 1.431q-.609.573-1.361.573zm11.968-2.004q0 4.438-2.83 7.766-2.831 3.328-7.132 4.008.072-4.903 2.975-8.339 2.902-3.435 6.987-3.435zM13.976 27.74q-4.3-.716-7.132-4.008-2.83-3.293-2.83-7.766 4.084 0 6.987 3.435 2.903 3.436 2.974 8.34z"></path></svg>
                </svg>`);
            break;
            case "Cycle":
                html=$(`<svg class="svgIcon hos-avail__header-icon" aria-label="The cycle time remaining for the driver in the ON duty and Driving status." focusable="false">
                <title>The time remaining before the driver's workday ends. The driver's workday starts from the moment they change their status to ON duty. The time spent in OFF duty and SB is included in the workday. This is a consecutive limit.</title>
                <svg viewBox="0 0 32 32" id="geo-ccw"><path d="M13.89 2Q8.101 2 4.05 6.098 0 10.195 0 16q0 5.805 4.051 9.902Q8.102 30 13.89 30q4.834 0 8.58-3.005l-2.384-2.527q-2.86 2.05-6.196 2.05-4.289 0-7.353-3.074Q3.472 20.37 3.472 16q0-4.37 3.064-7.444Q9.6 5.483 13.89 5.483q4.222 0 7.285 2.97 3.064 2.971 3.132 7.206h-4.834l6.264 6.965L32 15.66h-4.221q-.068-5.669-4.153-9.664Q19.54 2 13.889 2z"></path></svg>
                </svg>`);
            break;
            case "Workday":
                html=$(`<svg class="svgIcon hos-avail__header-icon" aria-label="The time remaining before the driver's workday ends. The driver's workday starts from the moment they change their status to ON duty. The time spent in OFF duty and SB is included in the workday. This is a consecutive limit." focusable="false">
                <title>The time remaining before the driver's workday ends. The driver's workday starts from the moment they change their status to ON duty. The time spent in OFF duty and SB is included in the workday. This is a consecutive limit.</title>
                <svg viewBox="0 0 32 32" id="geo-tools"><path d="M27.04 10.389q.256.288.352.793.096.505.096.902t.064.397q.064.072.544.541.48.469.608.613.512.505.896-.144l2.239-2.741q.352-.433-.064-.866-.064-.072-.576-.505t-.64-.577q-.192-.217-.863-.217-.672 0-1.184-.505-.448-.505-.576-1.37-.128-.866-.32-1.083-.064 0-.288-.252-.224-.253-.831-.794-.608-.54-1.312-1.118Q20.9.216 19.235 0q-3.902 0-4.734.072-.384 0 .256.289 3.839 1.875 4.862 2.741 2.56 2.02 1.152 4.112-1.088 1.66-1.216 1.732-.256.288.064.505.064.072 1.216 1.262 1.151 1.19 1.215 1.263.448.289.576.144 1.344-1.731 2.271-2.164.928-.433 2.144.433zm-9.148.938L4.777 28.497q-.576.794.064 1.37l1.535 1.516q.704.505 1.216-.145l13.243-17.026q.256-.288 0-.721l-2.303-2.236q-.384-.29-.64.072zM.171 4.04q-.512 3.752.511 5.988 1.6 3.174 4.927 2.237 1.79-.433 3.198 1.154l2.623 2.813 2.176-2.813-2.176-2.525q-.767-.866-.991-1.912-.224-1.046-.192-2.345.032-1.298-.16-2.092-.384-2.02-4.478-4.04-.384-.216-.576.108-.192.325-.064.541.384.433 1.471 2.886.448.36.384 1.263-.064.901-1.28 1.911-1.855 1.443-3.07-.793-.192-.433-.832-1.48-.64-1.045-.704-1.19-.128-.36-.416-.324-.287.036-.351.613zm27.445 24.673l-8.125-8.945-2.43 3.102 7.868 8.73q.64.72 1.216.143l1.471-1.659q.704-.65 0-1.37z"></path></svg>
            </svg>`);
            break;
            case "Cycle Tommorrow":
                html=$(`<svg class="svgIcon hos-avail__header-icon" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
                <title>The cycle time remaining for the driver on the following day.</title>
                <svg viewBox="0 0 32 32" id="geo-tools">
                  <path fill="black" d="m25.13938,4.08143l-0.86151,0l0,-0.93504c0,-1.18402 -0.93918,-2.14638 -2.09492,-2.14638c-1.15652,0 -2.09492,0.96236 -2.09492,2.14638l0,0.93426l-2.14985,0l0,-0.93426c0,-1.18402 -0.93918,-2.14638 -2.09492,-2.14638c-1.15574,0 -2.09492,0.96236 -2.09492,2.14638l0,0.93426l-2.14985,0l0,-0.93426c0,-1.18402 -0.93918,-2.14638 -2.09492,-2.14638c-1.15574,0 -2.09492,0.96236 -2.09492,2.14638l0,0.93426l-1.10003,0c-1.83835,0 -3.33462,1.48842 -3.33462,3.31714l0,18.73208c0,1.82872 1.49626,3.31714 3.33462,3.31714l18.83077,0c1.83914,0 3.33462,-1.48842 3.33462,-3.31714l0,-18.73208c0,-1.82794 -1.49626,-3.31636 -3.33462,-3.31636zm-3.87443,-0.93504c0,-0.53777 0.41192,-0.97563 0.918,-0.97563c0.50686,0 0.918,0.43786 0.918,0.97563l0,3.82134c0,0.53777 -0.41114,0.97563 -0.918,0.97563c-0.50608,0 -0.918,-0.43786 -0.918,-0.97563l0,-3.82134zm-6.33969,0c0,-0.53777 0.41192,-0.97563 0.918,-0.97563s0.918,0.43786 0.918,0.97563l0,3.82134c0,0.53777 -0.41192,0.97563 -0.918,0.97563s-0.918,-0.43786 -0.918,-0.97563l0,-3.82134zm-6.34048,0c0,-0.53777 0.41192,-0.97563 0.918,-0.97563s0.918,0.43786 0.918,0.97563l0,3.82134c0,0.53777 -0.41192,0.97563 -0.918,0.97563s-0.918,-0.43786 -0.918,-0.97563l0,-3.82134zm17.92768,22.98426c0,0.75319 -0.61592,1.36588 -1.37308,1.36588l-18.83077,0c-0.75715,0 -1.37308,-0.6127 -1.37308,-1.36588l0,-17.17107l21.57692,0l0,17.17107z" id="svg_1"/>
                  <path fill="black" d="m15.51094,12q-2.71359,0 -4.6125,1.90264q-1.89844,1.90218 -1.89844,4.59736q0,2.69518 1.8989,4.59736q1.89891,1.90264 4.61203,1.90264q2.26594,0 4.02187,-1.39518l-1.1175,-1.17325q-1.34062,0.95179 -2.90437,0.95179q-2.01046,0 -3.44671,-1.42721q-1.43672,-1.42721 -1.43672,-3.45614q0,-2.02893 1.43625,-3.45614q1.43625,-1.42675 3.44719,-1.42675q1.97906,0 3.41485,1.37893q1.43625,1.37939 1.46812,3.34564l-2.26594,0l2.93625,3.23375l2.93578,-3.23329l-1.97859,0q-0.03187,-2.63204 -1.94672,-4.48686q-1.91531,-1.85529 -4.56422,-1.85529l0.00046,0l0.00001,0z" id="svg_4"/>
                </svg>
               </svg>`);        
            break;
            default:
                html = $( `<span>${availabilityType}</span>` );
            break;
        } 
        return html;
    }
    

    function setDriverInfo({driverName, deviceName, trailerName}) {
        driverInfo.driverName = driverName ? driverName : driverInfo.driverName;  
        driverInfo.deviceName = deviceName ? deviceName : driverInfo.deviceName;  
        driverInfo.trailerName = trailerName ? trailerName : driverInfo.trailerName;  
        $("#device_name").text(driverInfo.deviceName);
        $("#trailer_attached").text(driverInfo.trailerName);
        $("#driver_details").text(driverInfo.driverName);
    }

    function formatDuration(duration) {
        var durationSplit = duration.split(":");
        var daysHours = durationSplit[0];
        var days, hours, minutes, totalHours;

        if (daysHours.split(".").length === 2) {
            days = daysHours.split(".")[0];
            hours = daysHours.split(".")[1];
            totalHours = (parseInt(days, 10) * 24) + parseInt(hours, 10);

        } else if (daysHours.split(".").length === 1) {
            totalHours = parseInt(daysHours.split(".")[0], 10);
        }
        minutes = parseInt(durationSplit[1], 10);

        return totalHours + "h " + minutes + "m";
    }

    function displayCurrentStatus(currentStatus) {
        var currStatusElt = $("#current_status");

        if (!currentStatus) {
            
            currStatusElt.text("No Current Status Information Available");
        
            currStatusElt.removeClass("available_status");
            
            currStatusElt.css("background","initial");
            return;
        }

        console.log("This is the current duty status:", currentStatus);

        
        currStatusElt.addClass("available_status");
        
        currStatusElt.text(currentStatus);

        if (currentStatus === "OFF") {         
            currStatusElt.css("background","#888888");
        } else if (currentStatus === "SB") {
            currStatusElt.css("background","#E95353");
        } else if (currentStatus === "D") {
            currStatusElt.css("background","#48BB48");
        } else if (currentStatus === "ON") {
            currStatusElt.css("background","#FFA500");
        } else if (currentStatus === "YM") {
            currStatusElt.css("background","#FFA500");
        } else {
            currStatusElt.css("background","#888888");
        }
    }

    function displayActiveTrailers(goDeviceid, currentDate) {
        service.api.call("Get", {
            "typeName": "TrailerAttachment",
            "search": {
                deviceSearch: { id: goDeviceid },
                activeFrom: currentDate,
                activeTo: currentDate
            }
        }).then(trailerAttachmentResult => {
            if (trailerAttachmentResult.length == 0) {
                console.log("No Active Trailer Attachments");
                setDriverInfo({trailerName: ""});
            } else {
                service.api.multiCall(trailerAttachmentResult.map(att => {
                    return ["Get", {
                        "typeName": "Trailer",
                        "search": {
                            id: att.trailer.id
                        }
                    }];
                }))
                    .then(result => {
                        let trailers = result.map(t => t[0].name);
                        setDriverInfo({trailerName: trailers.join(", ")+"-"});
                        trailers.forEach(name => {
                            console.log("Currently Attached Trailer Name:", name);
                        });
                    });
            }
        });
    }

    function displayShipmentInfo(shipmentInfo) {
        var shippingListFinal = [];

        for (var i = 0; i < shipmentInfo.length; i++) {
            console.log(shipmentInfo[i]);
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
            var shipments = shippingListFinal.map((s, i) => (i + 1) + ") " + s).join("\n");

            $("#shipment_attached").text(shipments);
            console.log("This is final shippinglist", shipments);
        } else {
            $("#shipment_attached").text("No Active Shipments");
        }
    }

    function showAvailabilityWarningIcon(warningIndex, warningIconClass, warningMessage) {
        $("#driver_availability_body svg")[warningIndex].removeClass("hos_availability_icon");
        $("#driver_availability_body td")[warningIndex].addClass(warningIconClass);
        $("#driver_availability_body td")[warningIndex].attr("title", warningMessage);
    }

    function getLatestMalfunctionDiagnosticLog(logList) {
        var isMalfunctionFound = false;
        var isDiagnosticFound = false;
        var malfunctionList = [];

        for (var j = 0; j < DiagMalflogStatuses.length; j++) {
            for (var i = logList.length - 1; i >= 0; i--) {
                var current = logList[i];
                var code = current.eventCode;
                var type = DiagMalflogStatuses[j];

                if (isMalfunctionFound && isDiagnosticFound) {
                    return;
                }
                if (type == current.status) {
                    if (!isMalfunctionFound && code == 1) {
                        var t1 = new Date(current.dateTime);
                        var str3 = current.status + " created on " + ((t1.getMonth() + 1) + "/" + t1.getDate() + " at " + t1.getHours() + ":" + t1.getMinutes() + "(localtime)");
                        malfunctionList.push(str3);
                    }

                    if (!isDiagnosticFound && code == 3) {
                        var t2 = new Date(current.dateTime);
                        var str4 = current.status + " created on " + ((t2.getMonth() + 1) + "/" + t2.getDate() + " at " + t2.getHours() + ":" + t2.getMinutes() + "(localtime)");
                        malfunctionList.push(str4);
                    }
                    if (code === 1 || code === 2) {
                        isMalfunctionFound = true;
                    } else {
                        isDiagnosticFound = true;
                    }
                } else {
                    break;
                }
            }
        }

        return malfunctionList;
    }

    function gotoHOSPage (driverId, start, end) {
        service.page.go("hosLogs", {
            driver: driverId,
            dateRange: {
                endDate: end,
                startDate: start
            }
        });
    }

    var goToHOSPageHandler;
    function goToHOSPage (driverId) {
        return function () {
            var now = new Date();
            var start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
            service.page.go("hosLogs", {
                driver: driverId,
                dateRange: {
                    endDate: new Date(start.getTime() + 24 * 60 * 60 * 1000),
                    startDate: start.toISOString()
                }
            });
        };
    }

    function GetHOSData(goDeviceid) {
        var currentDate = new Date().toISOString();
        var currentMidnight = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        var nextMidnight = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
        var lastWeek = new Date(new Date().setHours(-168, 0, 0, 0)).toISOString(); // last 7 days

        service.api.multiCall([
            ["Get", {
                "typeName": "DriverChange",
                "search":
                {
                    deviceSearch: { id: goDeviceid },
                    fromDate: currentDate,
                    toDate: currentDate,
                    includeOverlappedChanges: true
                }
            }],

            ["Get", {
                typeName: "Device",
                search: {
                    id: goDeviceid,
                }
            }],

            ["Get", {
                "typeName": "DVIRLog",
                "search": {
                    fromDate: currentDate,
                    includeBoundaryLogs: true,
                    deviceSearch: { id: goDeviceid }
                },
                "resultsLimit": 1
            }]

        ]).then(deviceRelatedData => {
            console.log("Multicall result",deviceRelatedData);
            var deviceName = deviceRelatedData[1][0].name;
            console.log("This is the devicename:", deviceName);
            setDriverInfo({deviceName: deviceName});
            var DVIRInfo = deviceRelatedData[2][0];
            if (DVIRInfo) {
                console.log("This is for DVIR Debugging", DVIRInfo);

                //This section will identify what is the state of the DVIR Log
                if (DVIRInfo.hasOwnProperty("certifyDate") && DVIRInfo.hasOwnProperty("repairDate")) {
                    console.log("Most recent DVIR log for this vehicle was repaired and certified");
                    $("#dvir").text("Most recent DVIR log for this vehicle was repaired and certified");
                } else if (!DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has no defects");
                    $("#dvir").text("Most recent DVIR log for this vehicle has no defects");
                } else if (!DVIRInfo.hasOwnProperty("defects") && DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has no defects and was certified");
                    $("#dvir").text("Most recent DVIR log for this vehicle has no defects and was certified");
                } else if (DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("repairDate")) {
                    console.log("Most recent DVIR log for this vehicle has defects but are not repaired");
                    $("#dvir").text("Most recent DVIR log for this vehicle has defects but are not repaired");
                } else if (DVIRInfo.hasOwnProperty("repairDate") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has defects but not certified");
                    $("#dvir").text("Most recent DVIR log for this vehicle has defects which are repaired but not certified");
                }
            } else {
                console.log("This vehicle never had a DVIR log done");
                
                $("#dvir").text("No DVIR Logs");
            }

            // need to do something here because its giving undefined error for vehicles which dont even have that object
            if (deviceRelatedData[0][0] && deviceRelatedData[0][0].driver !== "UnknownDriverId") {
                //console.log("This is the current driver id:",CurrentDriver)
                console.log("Driver Change Information", deviceRelatedData[0][0]);
                console.log("Device Related Data", deviceRelatedData);
                var CurrentDriver = deviceRelatedData[0][0].driver.id;
                createDriverButtons(CurrentDriver);
                console.log("Current Driver", CurrentDriver);

                $("#hos_data_view_logs_button").removeAttr("hidden");
                //Go to Duty Status Log page
                $("#hos_data_view_logs_button").off("click",goToHOSPageHandler);

                goToHOSPageHandler = goToHOSPage(CurrentDriver);
                $("#hos_data_view_logs_button").on("click",goToHOSPageHandler);

                let driverRegulations = service.api.call("Get", {
                    "typeName": "DriverRegulation",
                    "search": {
                        "userSearch": { "id": CurrentDriver }
                    }
                });
                
                driverRegulations.then(driverRegulationResult => {
                    var availabilityArrayDuration = [];
                    var currentTotalTime;
                    var previousTotalTime;
                    var index;
                    
                    console.log("Availability",driverRegulationResult[0]);
                    $("#driver_availability").text("");
                    $("#driver_availability_table").text("");

                    if (driverRegulationResult.length === 0) {
                        console.log("User is on no ruleset");
                        $("#driver_availability").text("User is on no ruleset");
                        return;
                    }

                    if (driverRegulationResult[0].availability.availabilities.length == 0) {
                        console.log("User is on no ruleset");
                        $("#driver_availability").text("User is on no ruleset");
                    } else {                        
                        var cycleAvailableTomorrow = driverRegulationResult[0].availability.cycleAvailabilities[0].available;
                        driverRegulationResult[0].availability.availabilities.push({
                            duration: cycleAvailableTomorrow,
                            type: "Cycle Tommorrow"
                        });
                        for (var j = 0; j < driverRegulationResult[0].availability.availabilities.length; j++) {
                            var availabilityType = driverRegulationResult[0].availability.availabilities[j].type;
                            var availabilityDuration = driverRegulationResult[0].availability.availabilities[j].duration;
                            availabilityArrayDuration.push(formatDuration(availabilityDuration));

                            
                            availabilityCard(availabilityType,availabilityDuration);

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

                    //Check if the driver is approaching violation and display the appropriate warning
                    if (previousTotalTime <= 120 && previousTotalTime > 60) {
                        showAvailabilityWarningIcon(index, "green_availability_warning", "The driver is approaching violation in 2 hours or less.");
                    } else if (previousTotalTime <= 60 && previousTotalTime > 30) {
                        showAvailabilityWarningIcon(index, "yellow_availability_warning", "The driver is approaching violation in 1 hour or less.");
                    } else if (previousTotalTime <= 30 && previousTotalTime > 0) {
                        showAvailabilityWarningIcon(index, "red_availability_warning", "The driver is approaching violation in 30 minutes or less.");
                    } else if (previousTotalTime === 0) {
                        showAvailabilityWarningIcon(index, "red_availability_warning", "The driver has no availability");
                    }

                    var violations = (driverRegulationResult[0].violations || [])
                        .filter(v => !!v.toDate)
                        .map(v => {
                            var vt = new Date(v.fromDate);
                            return v.type + " violation: " + (vt.getMonth() + 1) + "/" + vt.getDate() + " " + vt.getHours() + ":" + vt.getMinutes();
                        })
                        .join("\n");

                    if (violations.length > 0) {
                        console.log(violations);
                        $("#active_violation").text(violations);
                    } else {
                        $("#active_violation").text("No active violations!");
                    }

                    if (driverRegulationResult[0].hasOwnProperty("daySummaries")) {
                        var currentDaySummaries = driverRegulationResult[0].daySummaries[driverRegulationResult[0].daySummaries.length - 1];
                        var dailySummaryArray = [];

                        if (currentDaySummaries.hasOwnProperty("driveTotal")) {
                            dailySummaryArray.push("Daily Driving Total: " + formatDuration(currentDaySummaries.driveTotal));
                        }

                        if (currentDaySummaries.hasOwnProperty("offTotal")) {
                            dailySummaryArray.push("Daily Off Total: " + formatDuration(currentDaySummaries.offTotal));
                        }

                        if (currentDaySummaries.hasOwnProperty("onTotal")) {
                            dailySummaryArray.push("Daily On Total: " + formatDuration(currentDaySummaries.onTotal));
                        }

                        if (currentDaySummaries.hasOwnProperty("sleeperBerthTotal")) {
                            dailySummaryArray.push("Daily Sleeper Berth Total: " + formatDuration(currentDaySummaries.sleeperBerthTotal));
                        }
                        console.log(dailySummaryArray);

                        $("#daily_Summaries").text(dailySummaryArray.join("\n"));
                    } else {
                        console.log("No Day Summaries Available");
                        $("#daily_Summaries").text("No Daily Summary Information Available");
                    }
                });


                var statusLogs = service.api.multiCall([
                    ["Get", {
                        typeName: "DutyStatusLog",
                        search:
                        {
                            UserSearch: { id: CurrentDriver },
                            fromDate: currentDate,
                            statuses: ["D", "ON", "OFF", "SB", "YM", "PC", "WT"],
                            includeBoundaryLogs: true
                        }
                    }],
                    ["Get", {
                        typeName: "User",
                        search: {
                            id: CurrentDriver,
                        }
                    }],
                    ["Get", {
                        typeName: "ShipmentLog",
                        search:
                        {
                            deviceSearch: { id: goDeviceid },
                            fromDate: currentMidnight,
                            toDate: nextMidnight
                        }
                    }]
                ]);


                console.log("PROMISES:", statusLogs, driverRegulations);
                Promise.all([ statusLogs, driverRegulations ])
                    .then(function (result) {
                        console.log("test 1");
                        var multicallresults = result[0];
                        var driverRegulationResult = result[1];
                        var currentRuleset = multicallresults[1][0].hosRuleSet;
                        console.log("This is the driver's current ruleset:", currentRuleset);
                        $("#current_ruleset").text(currentRuleset);
                        setDriverInfo({driverName: multicallresults[1][0].name});
                        // Get available exemptions (16 hour, adverse driving
                        
                        console.log("test 2");
                        var availableExemptionsArray = [];
                        if (driverRegulationResult.length > 0) {
                            if (driverRegulationResult[0].availability.is16HourExemptionAvailable === true) {
                                availableExemptionsArray.push("16 Hour Exemption");
                            }
                            if (driverRegulationResult[0].availability.isAdverseDrivingExemptionAvailable === true) {
                                availableExemptionsArray.push("Adverse Driving Conditions");
                            }
                        }
                        console.log("test 3");

                        if (multicallresults[1][0].isPersonalConveyanceEnabled === true) {
                            availableExemptionsArray.push("Personal Conveyance");
                        }
                        if (multicallresults[1][0].isYardMoveEnabled === true) {
                            availableExemptionsArray.push("Yard Move");
                        }
                        if (multicallresults[1][0].isExemptHOSEnabled === true) {
                            availableExemptionsArray.push("Hos Exempt");
                        }
                        console.log("test 4");

                        //elt.querySelector("#available_exemptions").textContent = availableExemptionsArray.join("\n");
                        $('#available_exemptions').text(availableExemptionsArray.join("\n"));

                        displayCurrentStatus(multicallresults[0][0] && multicallresults[0][0].status);
                        displayShipmentInfo(multicallresults[2]);
                        console.log("test 5");
                    });
                //EventType |  EventCode  |   EventCode_Description
                //   7      |        1    |     An ELD Malfunction Logged
                //   7      |        2    |     An ELD Malfunction Cleared
                //   7      |        3    |     A Data Diagnostic Event Logged
                //   7      |        4    |     A Data Diagnostic Event Cleared


                // TODO: Need to account for malfunctions and diagnostics when a no driver is assigned to the vehicle
                service.api.call("Get", {
                    "typeName": "DutyStatusLog",
                    "search": {
                        deviceSearch: { id: goDeviceid },
                        statuses: DiagMalflogStatuses,
                        fromDate: lastWeek,
                        toDate: currentDate,
                        includeBoundaryLogs: true
                    }
                }).then(result => {
                    var malfunctionDiagnosticResult = result.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
                    console.log("These are the sorted results", malfunctionDiagnosticResult);

                    var activeMalfunctionList = getLatestMalfunctionDiagnosticLog(malfunctionDiagnosticResult);
                    console.log("This is the list of active malfunction/diagnostic:", activeMalfunctionList);

                    if (activeMalfunctionList.length === 0) {
                        
                        $('#malfunctions').text("No Active Malfunctions");
                    } else {
                        
                        $('#malfunctions').text(activeMalfunctionList.join("\n"));
                    }
                });

                displayActiveTrailers(goDeviceid, currentDate);
            } else if (!deviceRelatedData[0][0]) {
                console.log("No Driver Change object returned to get the HOS Data");
                
                $('#driver_details').text("No Driver Change object returned");
                
                $('#malfunctions').text("No malfunction information available");
                
                $('#driver_availability').text("No Availability information available");
               
                $('#active_violation').text("No violation information available");
                
                $("#current_status").removeClass("available_status");
                
                $("#current_status").css("background","initial");
                
                $('#current_status').text("No Current Status Information Available");
                
                $('#daily_Summaries').text("No Daily Summary Information Available");
                // elt.querySelector("#driver_availability_heading").textContent = "";
                //elt.querySelector("#driver_availability_body").textContent = "";
                
                $("#shipment_attached").text("No Active Shipments");
                
                $("#available_exemptions").text("No Exemption Information Available");
                
                $("#hos_data_view_logs_button").attr("hidden", "");
            } else if (deviceRelatedData[0][0].driver == "UnknownDriverId") {
                console.log("This Vehicle does not have an assigned Driver to get the HOS Data");
                
                $('#driver_details').text("No Driver assigned to the vehicle");
                
                $('#malfunctions').text("No malfunction information available");
                
                $('#driver_availability').text("No Availability information available");
                
                $('#active_violation').text("No violation information available");
                
                $("#current_status").removeClass("available_status");
                
                $("#current_status").css("background","initial");
                
                $('#current_status').text("No Current Status Information Available");
               
                $('#daily_Summaries').text("No Daily Summary Information Available");
                //elt.querySelector("#driver_availability_heading").textContent = "";
                //elt.querySelector("#driver_availability_body").textContent = "";
                
                $("#shipment_attached").text("No Active Shipments");
               
                $("#available_exemptions").text("No Exemption Information Available");
                
                $("#hos_data_view_logs_button").attr("hidden", "");
            }
        });
    }

    function attachMenuFunction() {
        // actionList attaches to some map popup menus: zone, route, device, map etc.
        // callback will be called if MyGeotab is about to show particular menu
        service.actionList.attachMenu("vehicleMenu", (...output) => {
            console.log("This is the output",output);

            // if you want to add new buttons to this menu, just return array of them
            // if you don't want to show something, just return an empty array
            return Promise.resolve([{
                title: "Display HOS data", // title of the new button
                clickEvent: "Clicked", // event will be fired when user clicks on button
                zIndex: +0, // zInxed for button in menu, to control where it should be places
                data: output[1] // some data that you need when user clicks on button
            }]);
        });
    }

    function preMessage() {
        driverInfo = {
            driverName: "",
            deviceName: "",
            trailerName: ""
        };
    
        $(".hos_data_addin_row").removeAttr("hidden");

        $(".hos_data_addin_row_initial_Message").attr("hidden", "");
    }

    attachMenuFunction();

    service.events.attach('click', (e) => { 
        preMessage();

        if (e.type == "device") {
            deleteMenuItems();
            GetHOSData(e.entity.id);
        }
    });

    service.actionList.attach("Clicked", data => {
        preMessage();
        console.log(data);
        if (data.menuName == "vehicleMenu") {
            deleteMenuItems();
            GetHOSData(data.device.id);
        }
    });
};