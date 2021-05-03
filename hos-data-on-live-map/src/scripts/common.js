import $ from 'jquery';

class Common {

    constructor(service) {
        this.service = service;
    }

    convertArrayToObject(array, key) {
        const initialValue = {};
        return array.reduce((obj, item) => {
            return {
            ...obj,
            [item[key]]: item,
            };
        }, initialValue);
    }

    getDifferences(arr1, arr2) { 
        return arr1.filter(x => !arr2.includes(x)); 
    }

    getDiagMalflogStatuses() {
        return [
            "PowerCompliance", "EngineSyncCompliance", "DataTransferCompliance", "PositioningCompliance", "TimingCompliance",
            "DataRecordingCompliance", "MissingElementCompliance", "UnidentifiedDrivingCompliance"
        ];
    }
    
    getStatusDuration(dateTime){
        
        var statusTime = (new Date(dateTime)).getTime();
        var now = (new Date()).getTime();
        let duration = now-statusTime;
        let hours = Math.floor(duration / 1000 / 60 / 60);
        let minutes = (duration - (hours * 1000 * 60 * 60)) / 1000 / 60;
        let seconds = (duration - (hours * 1000 * 60 * 60 * 60)) / 1000;
        
        return this.formatDuration(`${hours}:${minutes}:${seconds}`);
    }

    getStatusBackground() {
        return {
            "OFF": "#888888", 
            "SB": "#E95353", 
            "D": "#48BB48", 
            "ON": "#FFA500", 
            "YM": "#FFA500", 
            "default": "#888888"
        };
    }

    goToPage(page, params) {
        if(!params) params = {};
        this.service.page.go(page, params);
    }

    gotoTransferPage() {
        this.goToPage("transferEld");
    }

    initialize() {     
        this.initializeEventListeners();   
        this.createDefaultDropDownMenus();
    }

    initializeEventListeners() {        
        $("#backButton").click(() => this.navigateTabs("driver-info")); 
    }

    createMenuItem(id, text, callback) { 
        var menuItem=$(`<li><button class="dropdown-item" type="button" id="${id}">${text}</button></li>`);

        $('.main-dropdown').append(menuItem);

        return menuItem.find("button").click((e) => {            
            callback(e);
        });        
    }

    createMenuItems(menuItems) {
        this.refreshMenuItems();
        this.createSeperator();
        menuItems.forEach(item => {
            this.createMenuItem(item.id, item.text, item.callback);
        });
    }

    createDefaultDropDownMenus() {        
        this.createMenuItem("transferLogs", "Transfer Logs", (e) => {
            this.gotoTransferPage();
        });
        this.createMenuItem("compare-driver","Compare Driver",(e)=>{
            this.navigateTabs("driver-compare");
        });
    }

    refreshMenuItems() {        
        $('.main-dropdown').html("");
        this.createDefaultDropDownMenus();
    }    

    createSeperator() {        
        var menuItem = $(`<li><hr class="dropdown-divider"></li`);
        $('.main-dropdown').append(menuItem);        
    };

    navigateTabs(type) {
        if(type === 'driver-info') {                
            $("#backButton").attr("hidden","");
            $(".addin-driver-compare").attr("hidden","");
            $(".addin-driver-info").removeAttr("hidden","");
        } else if(type === 'driver-compare') {    
            console.log("test", type);            
            $("#backButton").removeAttr("hidden","");
            $(".addin-driver-compare").removeAttr("hidden","");
            $(".addin-driver-info").attr("hidden","");
        }
    }

    registerEvent(type, callback) {
        return (e) => {
            const compare = e.menuName || e.type;
            this.removePreMessage();    
            if (compare == type) {
                this.refreshMenuItems();
                callback(e);
            }
        };
    }  

    removePreMessage() {    
        $(".hos_data_addin_row").removeAttr("hidden");
        $(".hos_data_addin_row_initial_Message").attr("hidden", "");    
    }

    attachMenuEvent(name, menu, action, callback) {
        this.attachEvent('actionList', menu, action, callback);
        this.service.actionList.attachMenu(menu, (...output) => {
            return Promise.resolve([{
                title: name, 
                clickEvent: action,
                zIndex: +0, 
                data: output[1]
            }]);
        });
    }

    attachEvent(type, name, action, callback) {
        this.service[type].attach(action, this.registerEvent(name, callback));
    }

    goToHOSPage(driverId, start, end) {
        this.goToPage("hosLogs", {
            driver: driverId,
            dateRange: {
                endDate: end,
                startDate: start
            }
        });
    };

    gotoMessagePage(driverId) {
        this.goToPage("messages", {
            chatWith: {
              devices: [],
              users: [driverId]
            },
            isNewThread: false
        });
    };

    reduceMultiCall(results) {
        if(results.length === 1) return results[0];
        else return results;
    }

    formatDuration(duration) {
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

    getAvailabilityCards(availabilities) {
        if(!availabilities) return [$(`<div></div>`)];
        return availabilities.map(availability => {
            return this.getAvailabilityCard(availability.type, availability.duration);
        });
    }
    
    getAvailabilityCard(availabilityType, availabilityDuration) {
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

        card.find("#driver_availability_heading").append(this.availabilityIcons(availabilityType));
        card.find("#driver_availability_body").append(this.formatDuration(availabilityDuration));

        return card;
    }

    availabilityIcons(availabilityType){
        var html;
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

    getLatestMalfunctionDiagnosticLog(logList) {
        const malfunctionList = [];
        const DiagMalflogStatuses = this.getDiagMalflogStatuses();
        let isMalfunctionFound = false;
        let isDiagnosticFound = false;

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

}

export default Common = Common;

