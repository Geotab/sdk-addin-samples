import $ from 'jquery';
import { navbar, init as initNavbar } from '../navbar/navbar';
import { Map } from '../map';

const map = new Map();

import '../styles/form.scss'

let addin = $('.addin').clone();
$('.addin').remove();
$('body').append(`<div class="addin_container"></div>`);
$('.addin_container').append(navbar);
$('.addin_container').append(map.template);
$('.addin_container').append(addin);
initNavbar();

