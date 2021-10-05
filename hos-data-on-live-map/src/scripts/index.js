
import "../styles/index.scss";
import $ from 'jquery';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap-select/dist/js/bootstrap-select.min.js';
import Common from './common';
import DriverInfo from './driver-info';
import DriverCompare from './driver-compare';

// eslint-disable-next-line no-undef
geotab.addin.request = (elt, service) => {
    const driverInfo = new DriverInfo(service);
    const driverCompare = new DriverCompare(service);
    const common = new Common(service);    

    common.initialize();
    driverInfo.initiateMapEvents();
    driverCompare.initialize();
};