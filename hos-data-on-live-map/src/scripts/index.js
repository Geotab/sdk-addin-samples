import "../styles/index.css";
import "../styles/dropdown.scss";
// eslint-disable-next-line no-undef
geotab.addin.request = (elt, service) => {

    var el = document.querySelector('.more');
    var btn = el.querySelector('.more-btn');
    var menu = el.querySelector('.more-menu');
    var menuItems = el.querySelector('.more-menu-items');
    var visible = false;

    createTransferLog();

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

    function deleteMenuItems() {
        menuItems.innerHTML = "";
        createTransferLog();
    }

    function createSeperator() {
        var menuItem = document.createElement('li');
        menuItem.setAttribute('class','more-menu-item');
        menuItem.setAttribute('role','presentation');
        menuItem.innerHTML = "<hr />";
        menuItems.appendChild(menuItem);
    }

    function createMenuItem(id, text, callback) {

        var menuItem = document.createElement('li');
        menuItem.setAttribute('class','more-menu-item');

        var button = document.createElement('button');
        button.setAttribute('class','more-menu-btn');
        button.setAttribute('role','menuitem');
        button.setAttribute('type','button');
        button.setAttribute('id', id);
        button.innerHTML = text;

        menuItem.appendChild(button);
        menuItems.appendChild(menuItem);

        return button.addEventListener('click', (e) => {
            hideMenu();
            callback(e);
        }, false);
    }
    
    function showMenu(e) {
        e.preventDefault();
        if (!visible) {
            visible = true;
            el.classList.add('show-more-menu');
            menu.setAttribute('aria-hidden', false);
            document.addEventListener('mousedown', hideMenu, false);
        } else hideMenu(e);
    }
    
    function hideMenu(e) {
        if (e && e.target.className == 'more-menu-btn' || e && btn.contains(e.target)) {
            return;
        }
        if (visible) {
            visible = false;
            el.classList.remove('show-more-menu');
            menu.setAttribute('aria-hidden', true);
            document.removeEventListener('mousedown', hideMenu);
        }
    }
    
    btn.addEventListener('click', showMenu, false);

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
    }
    
    var DiagMalflogStatuses = [
        "PowerCompliance", "EngineSyncCompliance", "DataTransferCompliance", "PositioningCompliance", "TimingCompliance",
        "DataRecordingCompliance", "MissingElementCompliance", "UnidentifiedDrivingCompliance"
    ];

    var driverInfo = {
        driverName: "No Driver",
        deviceName: "",
        trailerName: ""
    };

    function setDriverInfo({driverName, deviceName, trailerName}) {
        driverInfo.driverName = driverName ? driverName : driverInfo.driverName;  
        driverInfo.deviceName = deviceName ? deviceName : driverInfo.deviceName;  
        driverInfo.trailerName = trailerName ? trailerName : driverInfo.trailerName;  
        elt.querySelector("#information").textContent = `${driverInfo.deviceName}(${driverInfo.trailerName}-${driverInfo.driverName})`;
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
        var currStatusElt = elt.querySelector("#current_status");

        if (!currentStatus) {
            currStatusElt.textContent = "No Current Status Information Available";
            currStatusElt.classList.remove("available_status");
            currStatusElt.style.background = "initial";
            return;
        }

        console.log("This is the current duty status:", currentStatus);

        currStatusElt.classList.add("available_status");
        currStatusElt.textContent = currentStatus;

        if (currentStatus === "OFF") {
            currStatusElt.style.background = "#888888";
        } else if (currentStatus === "SB") {
            currStatusElt.style.background = "#E95353";
        } else if (currentStatus === "D") {
            currStatusElt.style.background = "#48BB48";
        } else if (currentStatus === "ON") {
            currStatusElt.style.background = "#FFA500";
        } else if (currentStatus === "YM") {
            currStatusElt.style.background = "#FFA500";
        } else {
            currStatusElt.style.background = "#888888";
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
                        setDriverInfo({trailerName: trailers.join(", ")});
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

            elt.querySelector("#shipment_attached").textContent = shipments;
            console.log("This is final shippinglist", shipments);
        } else {
            elt.querySelector("#shipment_attached").textContent = "No Active Shipments";
        }
    }

    function showAvailabilityWarningIcon(warningIndex, warningIconClass, warningMessage) {
        elt.querySelectorAll("#driver_availability_body svg")[warningIndex].classList.remove("hos_availability_icon");
        elt.querySelectorAll("#driver_availability_body td")[warningIndex].classList.add(warningIconClass);
        elt.querySelectorAll("#driver_availability_body td")[warningIndex].setAttribute("title", warningMessage);
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
            var deviceName = deviceRelatedData[1][0].name;
            console.log("This is the devicename:", deviceName);
            setDriverInfo({deviceName: deviceName});
            var DVIRInfo = deviceRelatedData[2][0];
            if (DVIRInfo) {
                console.log("This is for DVIR Debugging", DVIRInfo);

                //This section will identify what is the state of the DVIR Log
                if (DVIRInfo.hasOwnProperty("certifyDate") && DVIRInfo.hasOwnProperty("repairDate")) {
                    console.log("Most recent DVIR log for this vehicle was repaired and certified");
                    elt.querySelector("#dvir").textContent = "Most recent DVIR log for this vehicle was repaired and certified";
                } else if (!DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has no defects");
                    elt.querySelector("#dvir").textContent = "Most recent DVIR log for this vehicle has no defects";
                } else if (!DVIRInfo.hasOwnProperty("defects") && DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has no defects and was certified");
                    elt.querySelector("#dvir").textContent = "Most recent DVIR log for this vehicle has no defects and was certified";
                } else if (DVIRInfo.hasOwnProperty("defects") && !DVIRInfo.hasOwnProperty("repairDate")) {
                    console.log("Most recent DVIR log for this vehicle has defects but are not repaired");
                    elt.querySelector("#dvir").textContent = "Most recent DVIR log for this vehicle has defects but are not repaired";
                } else if (DVIRInfo.hasOwnProperty("repairDate") && !DVIRInfo.hasOwnProperty("certifyDate")) {
                    console.log("Most recent DVIR log for this vehicle has defects but not certified");
                    elt.querySelector("#dvir").textContent = "Most recent DVIR log for this vehicle has defects which are repaired but not certified";
                }
            } else {
                console.log("This vehicle never had a DVIR log done");
                //elt.querySelector("dvir").textContent = "This vehicle never had a DVIR log done"
                elt.querySelector("#dvir").textContent = "No DVIR Logs";
            }

            // need to do something here because its giving undefined error for vehicles which dont even have that object
            if (deviceRelatedData[0][0] && deviceRelatedData[0][0].driver !== "UnknownDriverId") {
                //console.log("This is the current driver id:",CurrentDriver)
                console.log("Driver Change Information", deviceRelatedData[0][0]);
                console.log("Device Related Data", deviceRelatedData);
                var CurrentDriver = deviceRelatedData[0][0].driver.id;
                createDriverButtons(CurrentDriver);
                console.log("Current Driver", CurrentDriver);

                var hosDataButton = elt.querySelector("#hos_data_view_logs_button");

                hosDataButton.removeAttribute("hidden");
                //Go to Duty Status Log page
                hosDataButton.removeEventListener("click", goToHOSPageHandler, false);

                goToHOSPageHandler = goToHOSPage(CurrentDriver);
                hosDataButton.addEventListener("click", goToHOSPageHandler, false);

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

                    elt.querySelector("#driver_availability").textContent = "";
                    var element = elt.querySelector("#driver_availability_heading");
                    element.innerHTML = "";

                    var element2 = elt.querySelector("#driver_availability_body");
                    element2.innerHTML = "";

                    if (driverRegulationResult.length === 0) {
                        console.log("User is on no ruleset");
                        elt.querySelector("#driver_availability").textContent = "User is on no ruleset";
                        return;
                    }

                    if (driverRegulationResult[0].availability.availabilities.length == 0) {
                        console.log("User is on no ruleset");
                        elt.querySelector("#driver_availability").textContent = "User is on no ruleset";
                    } else {
                        for (var j = 0; j < driverRegulationResult[0].availability.availabilities.length; j++) {
                            var availabilityType = driverRegulationResult[0].availability.availabilities[j].type;
                            var availabilityDuration = driverRegulationResult[0].availability.availabilities[j].duration;
                            availabilityArrayDuration.push(formatDuration(availabilityDuration));

                            var tempAvailabilityHeading = document.createElement("td");
                            tempAvailabilityHeading.textContent = availabilityType;
                            elt.querySelector("#driver_availability_heading").appendChild(tempAvailabilityHeading);

                            var tempAvailabilityBody = document.createElement("td");
                            tempAvailabilityBody.textContent = formatDuration(availabilityDuration);

                            var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                            svgElement.setAttribute("class", "hos_availability_icon");
                            svgElement.setAttribute("height", "14px");
                            svgElement.setAttribute("width", "14px");
                            svgElement.setAttribute("viewBox", "0 0 45.311 45.311");

                            var pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
                            pathElement.setAttribute("d", "M22.675,0.02c-0.006,0-0.014,0.001-0.02,0.001c-0.007,0-0.013-0.001-0.02-0.001C10.135,0.02,0,10.154,0,22.656 c0,12.5,10.135,22.635,22.635,22.635c0.007,0,0.013,0,0.02,0c0.006,0,0.014,0,0.02,0c12.5,0,22.635-10.135,22.635-22.635 C45.311,10.154,35.176,0.02,22.675,0.02z M22.675,38.811c-0.006,0-0.014-0.001-0.02-0.001c-0.007,0-0.013,0.001-0.02,0.001 c-2.046,0-3.705-1.658-3.705-3.705c0-2.045,1.659-3.703,3.705-3.703c0.007,0,0.013,0,0.02,0c0.006,0,0.014,0,0.02,0 c2.045,0,3.706,1.658,3.706,3.703C26.381,37.152,24.723,38.811,22.675,38.811z M27.988,10.578 c-0.242,3.697-1.932,14.692-1.932,14.692c0,1.854-1.519,3.356-3.373,3.356c-0.01,0-0.02,0-0.029,0c-0.009,0-0.02,0-0.029,0 c-1.853,0-3.372-1.504-3.372-3.356c0,0-1.689-10.995-1.931-14.692C17.202,8.727,18.62,5.29,22.626,5.29 c0.01,0,0.02,0.001,0.029,0.001c0.009,0,0.019-0.001,0.029-0.001C26.689,5.29,28.109,8.727,27.988,10.578z");

                            svgElement.appendChild(pathElement);

                            tempAvailabilityBody.appendChild(svgElement);
                            elt.querySelector("#driver_availability_body").appendChild(tempAvailabilityBody);

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
                        elt.querySelector("#active_violation").textContent = violations;
                    } else {
                        elt.querySelector("#active_violation").textContent = "No active violations!";
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

                        elt.querySelector("#daily_Summaries").textContent = dailySummaryArray.join("\n");
                    } else {
                        console.log("No Day Summaries Available");
                        elt.querySelector("#daily_Summaries").textContent = "No Daily Summary Information Available";
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

                Promise.all([ statusLogs, driverRegulations ])
                    .then(function (result) {
                        var multicallresults = result[0];
                        var driverRegulationResult = result[1];
                        console.log("Driver Name",multicallresults);
                        var driverDetails = multicallresults[1][0].hosRuleSet;
                        console.log("This is the driver name:", driverDetails);
                        elt.querySelector("#driver_details").textContent = driverDetails;
                        setDriverInfo({driverName: multicallresults[1][0].name});
                        // Get available exemptions (16 hour, adverse driving)
                        var availableExemptionsArray = [];
                        if (driverRegulationResult.length > 0) {
                            if (driverRegulationResult[0].availability.is16HourExemptionAvailable === true) {
                                availableExemptionsArray.push("16 Hour Exemption");
                            }
                            if (driverRegulationResult[0].availability.isAdverseDrivingExemptionAvailable === true) {
                                availableExemptionsArray.push("Adverse Driving Conditions");
                            }
                        }

                        if (multicallresults[1][0].isPersonalConveyanceEnabled === true) {
                            availableExemptionsArray.push("Personal Conveyance");
                        }
                        if (multicallresults[1][0].isYardMoveEnabled === true) {
                            availableExemptionsArray.push("Yard Move");
                        }
                        if (multicallresults[1][0].isExemptHOSEnabled === true) {
                            availableExemptionsArray.push("Hos Exempt");
                        }

                        elt.querySelector("#available_exemptions").textContent = availableExemptionsArray.join("\n");

                        displayCurrentStatus(multicallresults[0][0] && multicallresults[0][0].status);
                        displayShipmentInfo(multicallresults[2]);
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
                        elt.querySelector("#malfunctions").textContent = "No Active Malfunctions";
                    } else {
                        elt.querySelector("#malfunctions").textContent = activeMalfunctionList.join("\n");
                    }
                });

                displayActiveTrailers(goDeviceid, currentDate);
            } else if (!deviceRelatedData[0][0]) {
                console.log("No Driver Change object returned to get the HOS Data");
                elt.querySelector("#driver_details").textContent = "No Driver Change object returned to get the HOS Data";
                elt.querySelector("#malfunctions").textContent = "No malfunction information available";
                elt.querySelector("#driver_availability").textContent = "No Availability information available";
                elt.querySelector("#active_violation").textContent = "No violation information available";
                elt.querySelector("#current_status").classList.remove("available_status");
                elt.querySelector("#current_status").style.background = "initial";
                elt.querySelector("#current_status").textContent = "No Current Status Information Available";
                elt.querySelector("#trailer_attached").textContent = "No Trailer Information Available";
                elt.querySelector("#daily_Summaries").textContent = "No Daily Summary Information Available";
                elt.querySelector("#driver_availability_heading").textContent = "";
                elt.querySelector("#driver_availability_body").textContent = "";
                elt.querySelector("#shipment_attached").textContent = "No Active Shipments";
                elt.querySelector("#available_exemptions").textContent = "No Exemption Information Available";
                elt.querySelector("#hos_data_view_logs_button").setAttribute("hidden", "");
            } else if (deviceRelatedData[0][0].driver == "UnknownDriverId") {
                console.log("This Vehicle does not have an assigned Driver to get the HOS Data");
                elt.querySelector("#driver_details").textContent = "This Vehicle does not have an assigned Driver to get the HOS Data";
                elt.querySelector("#malfunctions").textContent = "No malfunction information available";
                elt.querySelector("#driver_availability").textContent = "No Availability information available";
                elt.querySelector("#active_violation").textContent = "No violation information available";
                elt.querySelector("#current_status").classList.remove("available_status");
                elt.querySelector("#current_status").style.background = "initial";
                elt.querySelector("#current_status").textContent = "No Current Status Information Available";
                elt.querySelector("#trailer_attached").textContent = "No Trailer Information Available";
                elt.querySelector("#daily_Summaries").textContent = "No Daily Summary Information Available";
                elt.querySelector("#driver_availability_heading").textContent = "";
                elt.querySelector("#driver_availability_body").textContent = "";
                elt.querySelector("#shipment_attached").textContent = "No Active Shipments";
                elt.querySelector("#available_exemptions").textContent = "No Exemption Information Available";
                elt.querySelector("#hos_data_view_logs_button").setAttribute("hidden", "");
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
        var rows = elt.querySelectorAll(".hos_data_addin_row");

        for (var i = 0; i < rows.length; i++) {
            rows[i].removeAttribute("hidden");
        }
        elt.querySelector(".hos_data_addin_row_initial_Message").setAttribute("hidden", "");
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

        if (data.menuName == "vehicleMenu") {
            deleteMenuItems();
            GetHOSData(data.device.id);
        }
    });
};