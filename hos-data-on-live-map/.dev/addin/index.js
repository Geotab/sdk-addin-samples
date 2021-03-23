import $ from 'jquery';
import { navbar, init as initNavbar } from '../navbar/navbar';
import { Map } from '../map';

const map = new Map();

import '../styles/form.scss'

let addin = $('.addin').clone();
$('.addin').remove();
$('body').append(`<div class="container"></div>`);
$('.container').append(navbar);
$('.container').append(map.template);
$('.container').append(addin);
initNavbar();

