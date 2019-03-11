/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.tripsTimeline = () => {
    'use strict';

    /* Scope variables */
    let api;
    let state;

    let elContainer = document.getElementById('tripstimeline-chart-container');
    let elPrevButton = document.getElementById('tripstimeline-chart-prev');
    let elNextButton = document.getElementById('tripstimeline-chart-next');

    let timeline;
    let from = new Date();
    let to = new Date();
    let step = 1000 * 60 * 60 * 4;
    let loadOffset = 1000 * 60 * 60 * 2;
    let data = [];
    let loadedIds = {};
    let devicesCache = false;
    let renderWhenDevicesLoaded = false;
    let scrollInterval = null;

    /**
     *	Retrieves a list of trips from the server and adds them to the select box
     *	@param {Date} fromDate Start date
     *	@param {Date} toDate End date
     *  @returns {Promise} A promise with trips
    */
    let getTrips = (fromDate, toDate) => {
        return new Promise((resolve) => {
            api.call('Get', {
                typeName: 'Trip',
                search: {
                    fromDate: fromDate.toISOString(),
                    toDate: toDate.toISOString()
                },
                resultsLimit: 10000
            }, resolve);
        }).catch(error => {
            alert(error);
            return [];
        });
    };

    /**
     * Escapes string HTML for DOM
     * @param {String} s The string to escape
     */
    let encodeHTML = s => {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    };

    /**
     *  Loads trip data for the given date range
     *  @param {Date} fromDate Start date
     *  @param {Date} toDate End date
     */
    let load = (fromDate, toDate) => {
        getTrips(fromDate, toDate).then(trips => {
            let trip, device, i,
                start, stop;

            for (i = 0; i < trips.length; i++) {
                trip = trips[i];
                device = devicesCache[trip.device.id];
                if (device && !loadedIds[trip.id]) {
                    loadedIds[trip.id] = true;
                    start = new Date(trip.start);
                    stop = new Date(trip.stop);

                    data.push({
                        id: trip.id,
                        content: encodeHTML(device.name) + '<br>' + formatPeriod(start, stop) + getTripLink(start, stop, device),
                        start: start,
                        end: stop
                    });
                }
            }
            timeline.setItems(data);
            timeline.redraw();
        });
    };

    /**
     * Scrolls the chart forward or back in time by the interval
     * @param {Number} direction The direction to step the chart [-1 = left] [1 = right]
     */
    let scrollStep = direction => {
        if (timeline) {
            let range = timeline.getWindow(),
                interval = range.end - range.start;

            timeline.setWindow({
                start: range.start.valueOf() + direction * interval * 0.5,
                end: range.end.valueOf() + direction * interval * 0.5
            });
        }
    };

    /**
     * Recalcualtes container width on resize
     */
    let resize = () => {
        elContainer.style.width = (elContainer.parentNode.offsetWidth - elPrevButton.offsetWidth - elNextButton.offsetWidth - 20) + 'px';
    };

    /**
     * Initialize the add-in
     */
    let initialize = () => {
        timeline = new vis.Timeline(elContainer, [], {
            orientation: 'top',
            zoomMin: 1000 * 60 * 60 * 4,
            zoomMax: 1000 * 60 * 60 * 4,
            minHeight: 180
        });

        timeline.on('rangechange', range => {
            let date;
            if (range.start.valueOf() - from.valueOf() < loadOffset) {
                date = from;
                from = new Date(from.valueOf() - step);
                load(from, date);
            }
            if (to.valueOf() - range.end.valueOf() < loadOffset) {
                date = to;
                to = new Date(to.valueOf() + step);
                load(from, date);
            }
        });

        /**
         * Move the chart back one interval
         */
        let moveBackward = () => {
            if (!scrollInterval) {
                scrollStep(-1);
                scrollInterval = window.setInterval(() => {
                    scrollStep(-1);
                }, 200);
            }
        };

        /**
        * Move the chart forward one interval
        */
        let moveForward = () => {
            if (!scrollInterval) {
                scrollStep(1);
                scrollInterval = window.setInterval(() => {
                    scrollStep(1);
                }, 200);
            }
        };

        /**
        * Stop scrolling
        */
        let stopScrolling = () => {
            if (scrollInterval) {
                window.clearInterval(scrollInterval);
                scrollInterval = null;
            }
        };

        let isBrowserSupportTouchEvents = (() => {
            let result = true;
            try {
                document.createEvent('TouchEvent');
            } catch (e) {
                result = false;
            }
            return result;
        })();

        /* Event Handlers */
        if (isBrowserSupportTouchEvents) {
            elPrevButton.addEventListener('touchstart', moveBackward, false);
        } else {
            elPrevButton.addEventListener('mousedown', moveBackward, false);
        }

        if (isBrowserSupportTouchEvents) {
            elNextButton.addEventListener('touchstart', moveForward, false);
        } else {
            elNextButton.addEventListener('mousedown', moveForward, false);
        }

        document.body.addEventListener('mouseup', stopScrolling, false);

        if (isBrowserSupportTouchEvents) {
            document.body.addEventListener('touchend', stopScrolling, false);
        }

        resize();
    };

    /**
     * Render the chart
     */
    let render = () => {
        if (!devicesCache) {
            loadDevices();
            renderWhenDevicesLoaded = true;
            return false;
        }
        data = [];
        loadedIds = {};
        from = new Date(timeline.range.start - step);
        to = new Date(timeline.range.start + step);

        resize();
        load(from, to);
        return true;
    };

    /**
     * Load devices and renders
     */
    let loadDevices = () => {
        api.call('Get', {
            typeName: 'Device',
            resultsLimit: 1000,
            search: {
                groups: state.getGroupFilter ? state.getGroupFilter() : [{ id: 'GroupCompanyId' }],
                fromDate: new Date().toISOString
            }
        }, devices => {
            let cache = {}, i;

            for (i = 0; i < devices.length; i++) {
                cache[devices[i].id] = devices[i];
            }
            devicesCache = cache;
            if (renderWhenDevicesLoaded) {
                render();
                renderWhenDevicesLoaded = false;
            }
        }, error => {
            alert(error);
        });
        return false;
    };

    /**
     * Formats a date's time to a string
     * @param {Date} date The date
     * @returns {String} The time string [0h:0m]
     */
    let formatTime = date => {
        let h = '' + date.getHours(),
            m = '' + date.getMinutes();

        if (h.length === 1) {
            h = '0' + h;
        }
        if (m.length === 1) {
            m = '0' + m;
        }
        return h + ':' + m;
    };

    /**
     * Formats a time ranfe to a string
     * @param {Date} start The start date
     * @param {Date} end The end date
     * @returns {String} The time string [0h:0m - 0h:0m]
     */
    let formatPeriod = (start, end) => {
        return formatTime(start) + ' - ' + formatTime(end);
    };

    /**
     * Creates an HTML anchor string to the trips page for a given device and date range
     * @param {Date} start The start date
     * @param {Date} end The end date
     * @param {Date} device The devie
     * @returns {String} HTML anchor string
     */
    let getTripLink = (start, end, device) => {
        return `<a href="#tripsHistory,dateRange:(endDate:'' + end.toISOString() + '',startDate:'' + start.toISOString() + ''),devices:!(${device.id})" class="geotabButtonIcons externalLink detailslink" target="_blank"></a>`;
    };

    /**
     * Aborts
     */
    let abort = () => {
        data = [];
        loadedIds = {};
        devicesCache = false;
    };

    return {
        /*
         * Page lifecycle method: initialize is called once when the Add-In first starts
         * Use this function to initialize the Add-In's state such as default values or
         * make API requests (Geotab or external) to ensure interface is ready for the user.
         */
        initialize(freshApi, freshState, callback) {
            api = freshApi;
            state = freshState;

            initialize();
            if (callback) {
                callback();
            }
        },

        /*
         * Page lifecycle method: focus is called when the page has finished initialize method
         * and again when a user leaves and returns to your Add-In that has already been initialized.
         * Use this function to refresh state such as vehicles, zones or exceptions which may have
         * been modified since it was first initialized.
         */
        focus(freshApi, freshState) {
            api = freshApi;
            state = freshState;

            // devices must be reloaded when page is focused
            devicesCache = false;
            render();
        },

        /*
         * Page lifecycle method: blur is called when the user is leaving your Add-In.
         * Use this function to save state or commit changes to a datastore or release memory.
         */
        blur() {
            abort();
        }
    };
};
