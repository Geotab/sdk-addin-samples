"use strict";geotab.addin.proximity=function(){var e=void 0,t=void 0,n=void 0,i=void 0,o=void 0,a=void 0,r=void 0,d=void 0,u=void 0,c=void 0,l=void 0,s=250,f={},m=[],v=!0,g=!1,y=function(e){c.innerHTML=e},p=function(e){e?l.style.display="block":setTimeout(function(){l.style.display="none"},600)},h=function(e){return e*(v?1:1.09361)},w=function(e){return new L.Marker(e,{icon:new L.DivIcon({className:"map-icon",iconSize:[16,16]})})},M=function(e){var t=new L.LatLng(e.latitude,e.longitude),i=e.distance,o=w(t),a=new Date(e.dateTime);o.bindTooltip(f[e.device.id].name+" was "+Math.floor(h(i))+" "+(v?" m":" yd")+" away on "+a.toDateString()+" at "+a.toTimeString()),n.addLayer(o)},x=function(){n.clearLayers()},b=function(){if(y(""),""!==o.value){if(!g&&0===m.length)return void y("Select at least one vehicle to display");var n=new Date(d.value+":00Z"),i=new Date(n.setMinutes(n.getMinutes()+(new Date).getTimezoneOffset())).toISOString(),a=new Date(u.value+":00Z"),r=new Date(a.setMinutes(a.getMinutes()+(new Date).getTimezoneOffset())).toISOString();x(),p(!0),e.call("GetCoordinates",{addresses:[o.value]},function(n){if(!n||n.length<1||!n[0])return y("Could not find the address"),void p(!1);var a=function(e){var t=5*s;return e.filter(function(e){return e.distance<t})},d=function(e){y(e.length>0?"There were "+e.length+" locations recorded nearby to "+o.value+".":"There was no one near this area during this time frame."),e.forEach(M),p(!1)},u=function(e,t,n){return["Get",{typeName:"LogRecord",search:{deviceSearch:{id:e},fromDate:t,toDate:n}}]},c=function(e){return e.reduce(function(e,t){return e.concat(t)},[])},l=function(e,t,n,i,o){return new L.Circle([t,e],n,{stroke:!1,fillColor:i,fillOpacity:o})},v=l(n[0].x,n[0].y,1*s,"#ff4444",.3),h=l(n[0].x,n[0].y,2*s,"#ff8800",.3),w=l(n[0].x,n[0].y,3*s,"#ff8800",.3),x=l(n[0].x,n[0].y,4*s,"#99cc00",.3),b=l(n[0].x,n[0].y,5*s,"#33b5e5",.3),T={latitude:n[0].y,longitude:n[0].x};window.geotabHeatMap=window.geotabHeatMap||{},window.geotabHeatMap.center=T,t.setView(new L.LatLng(T.latitude,T.longitude),14),b.addTo(t),x.addTo(t),w.addTo(t),h.addTo(t),v.addTo(t);var E=g?Object.keys(f).map(function(e){return f[e]}):m.map(function(e){return{id:e}}),I=E.map(function(e){return u(e.id,i,r)});e.multiCall(I,function(e){var t=new Parallel(c(e),{env:{center:T}}),n=function(e){var t="undefined"!=typeof window?window.geotabHeatMap.center:global.env.center,n=function(e){return e*(Math.PI/180)},i=n(t.latitude-e.latitude),o=n(t.longitude-e.longitude),a=Math.sin(i/2)*Math.sin(i/2)+Math.cos(n(e.latitude))*Math.cos(n(t.latitude))*Math.sin(o/2)*Math.sin(o/2),r=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return e.distance=6371e3*r,e};t.map(n).then(a).then(d)},function(e){y(e),p(!1)})},function(e){y(e),p(!1)})}},T=function(e,f){var y=function(t){var n=h(5*t),i=void 0,o=void 0;s=t,e&&n>=1e3?(i=Number(Math.round(n/1e3+"e1")+"e-1"),o="km"):!e&&n>=1760?(i=Number(Math.round(n/1760+"e1")+"e-1"),o="mi"):(i=Math.round(n),o=e?" m":" yd"),document.getElementById("proximity-size-label").innerHTML="("+i+" "+o+")"};v=e,t=new L.Map("proximity-map",{center:new L.LatLng(f.latitude,f.longitude),zoom:9}),L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2VvdGFiIiwiYSI6ImNpd2NlaW02MjAxc28yeW9idTR3dmRxdTMifQ.ZH0koA2g2YMMBOcx6EYbwQ").addTo(t),n=L.layerGroup().addTo(t),o=document.getElementById("proximity-address"),a=document.getElementById("proximity-vehicles"),d=document.getElementById("proximity-from"),u=document.getElementById("proximity-to"),c=document.getElementById("proximity-error"),l=document.getElementById("proximity-loading"),r=document.getElementById("proximity-div-vehicles");var p=new Date,w=p.getDate(),M=p.getMonth()+1,x=p.getFullYear();w<10&&(w="0"+w),M<10&&(M="0"+M),d.value=x+"-"+M+"-"+w+"T00:00",u.value=x+"-"+M+"-"+w+"T23:59",y(300),i=new Choices(a,{removeItemButton:!0}),i.passedElement.addEventListener("change",function(){m=i.getValue().map(function(e){return e.value}),b()}),o.addEventListener("keydown",function(e){13===e.keyCode&&b()}),document.getElementById("proximity-size").addEventListener("change",function(e){y(e.target.value),b()}),document.getElementById("proximity-select-all").addEventListener("change",function(e){e.preventDefault(),g=!g,r.style.display=g?"none":"block",b()}),d.addEventListener("change",function(e){e.preventDefault(),b()}),u.addEventListener("change",function(e){e.preventDefault(),b()})},E=function(t){if(!t)throw new Error("'callback' is null or undefined");e.getSession(function(n){n&&n.userName&&e.call("Get",{typeName:"User",search:{name:n.userName}},function(e){t(e.length>0&&!!e[0].isMetric)},function(){t(!1)})},!1)};return{initialize:function(t,n,i){e=t,E(function(e){"geolocation"in navigator?navigator.geolocation.getCurrentPosition(function(t){T(e,t.coords),i()}):(T(e,{longitude:-79.709441,latitude:43.434497}),i())})},focus:function(n,o){p(!0),e=n,e.call("Get",{typeName:"Device",resultsLimit:1e3,search:{fromDate:(new Date).toISOString(),groups:o.getGroupFilter()}},function(e){if(e&&!(e.length<1)){var t=e.map(function(e){return f[e.id]=e,{value:e.id,label:e.name}});i=i.setChoices(t,"value","label",!0),p(!1)}},function(e){y(e),p(!1)}),setTimeout(function(){t.invalidateSize()},800)},blur:function(){f&&(f={})}}};