"use strict";geotab.addin.heatmap=function(){var v,h,m,p,y,E,w,i,l,r,c,D,t,I=5e4,b=function(e){l.innerHTML=e},B=function(e){r.innerHTML=e};function x(e){if(!e||0===e.length)return!0;for(var t=0;t<e.length;t++){if(0<e[t].length)return!1}return!0}function S(e){return e.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g,"$1,")}function N(){return Math.round((new Date-t)/1e3)}var T=function(e){e?(i.disabled=!0,c.style.display="block"):(setTimeout(function(){c.style.display="none"},600),i.disabled=!1)},d=function(){void 0!==m&&h.removeLayer(m),m=L.heatLayer({radius:{value:24,absolute:!1},opacity:.7,gradient:{.45:"rgb(0,0,255)",.55:"rgb(0,255,255)",.65:"rgb(0,255,0)",.95:"yellow",1:"rgb(255,0,0)"}}).addTo(h);for(var e=D=0;e<y.options.length;e++)y.options[e].selected&&D++;0!==D?(t=new Date,!0===p.disabled?n():o()):b("Please select at least one vehicle from the list and try again.")},n=function(){y.value;for(var e,t=[],n=y.options,o=0,a=n.length;o<a;o++)(e=n[o]).selected&&t.push(e.value||e.text);var i=E.value,l=w.value;if(b(""),B(""),null!==t&&""!==i&&""!==l){T(!0);for(var r=new Date(i).toISOString(),c=new Date(l).toISOString(),d=[],u=0,s=t.length;u<s;u++)d.push(["Get",{typeName:"LogRecord",resultsLimit:I,search:{deviceSearch:{id:t[u]},fromDate:r,toDate:c}}]);v.multiCall(d,function(e){if(x(e))return b("No data to display"),void T(!1);for(var t=[],n=[],o=0,a=0,i=[],l=0,r=e.length;l<r;l++){i=e[l];for(var c=0;c<i.length;c++)0===i[c].latitude&&0===i[c].longitude||(t.push({lat:i[c].latitude,lon:i[c].longitude,value:1}),n.push(new L.LatLng(i[c].latitude,i[c].longitude)),o++);i.length>=I&&a++}0<t.length?(h.fitBounds(n),m.setLatLngs(t),B("Displaying ".concat(S(o)," combined log records for the\n        ").concat(S(D)," selected vehicles. [").concat(N()," sec]")),0<a&&b("Note: Not all results are displayed because the result limit of \n          ".concat(S(I)," was exceeded for \n          ").concat(S(a)," of the selected vehicles."))):b("No data to display"),T(!1)},function(e){alert(e),T(!1)})}},o=function(){y.value;for(var e,t=p.options[p.selectedIndex].value,g=p.options[p.selectedIndex].text,n=[],o=y.options,a=0,i=o.length;a<i;a++)(e=o[a]).selected&&n.push(e.value||e.text);var l=E.value,r=w.value;if(b(""),B(""),null!==n&&null!==t&&""!==l&&""!==r){T(!0);for(var c=new Date(l).toISOString(),d=new Date(r).toISOString(),u=[],s=0,f=n.length;s<f;s++)u.push(["Get",{typeName:"ExceptionEvent",resultsLimit:I,search:{deviceSearch:{id:n[s]},ruleSearch:{id:t},fromDate:c,toDate:d}}]);v.multiCall(u,function(e){if(x(e))return b("No data to display"),void T(!1);for(var u=0,s=0,t=[],n=0,o=e.length;n<o;n++){for(var a=e[n],i=0;i<a.length;i++)u++,t.push(["Get",{typeName:"LogRecord",resultsLimit:I,search:{deviceSearch:{id:a[i].device.id},fromDate:a[i].activeFrom,toDate:a[i].activeTo}}]);a.length>=I&&s++}v.multiCall(t,function(e){if(x(e))return b("No data to display"),void T(!1);for(var t=[],n=[],o=0,a=0,i=0,l=e.length;i<l;i++){for(var r=e[i],c=0;c<r.length;c++)0===r[c].latitude&&0===r[c].longitude||(t.push({lat:r[c].latitude,lon:r[c].longitude,value:1}),n.push(new L.LatLng(r[c].latitude,r[c].longitude)),o++);r.length>=I&&a++}if(0<t.length){if(h.fitBounds(n),m.setLatLngs(t),B("Displaying ".concat(S(o)," combined log records associated with the\n          ").concat(S(u)," '").concat(g,"' rule exceptions found for the \n          ").concat(S(D)," selected vehicles. [").concat(N()," sec]")),0<s||0<a){var d="Note: Not all results are displayed because";s&&(d+=" the result limit of \n              ".concat(S(I)," was exceeded for '").concat(g,"' rule exceptions")),0<s&&0<a&&(d+=" and"),0<a&&(d+=" the result limit of \n              ".concat(S(I)," was exceeded for \n              ").concat(S(exceededResultsLimitCount)," of the selected vehicles.")),b(d+=".")}T(!1)}else b("No data to display")},function(e){alert(e),T(!1)})},function(e){alert(e),T(!1)})}},a=function(e){h=new L.Map("heatmap-map",{center:new L.LatLng(e.latitude,e.longitude),zoom:13}),L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',subdomains:["a","b","c"]}).addTo(h),p=document.getElementById("exceptionTypes"),y=document.getElementById("vehicles"),E=document.getElementById("from"),w=document.getElementById("to"),i=document.getElementById("showHeatMap"),l=document.getElementById("error"),r=document.getElementById("message"),c=document.getElementById("loading");var t=new Date,n=t.getDate(),o=t.getMonth()+1,a=t.getFullYear();n<10&&(n="0"+n),o<10&&(o="0"+o),E.value=a+"-"+o+"-"+n+"T00:00",w.value=a+"-"+o+"-"+n+"T23:59",document.getElementById("visualizeByLocationHistory").addEventListener("click",function(e){p.disabled=!0}),document.getElementById("visualizeByExceptionHistory").addEventListener("click",function(e){p.disabled=!1}),document.getElementById("exceptionTypes").addEventListener("change",function(e){e.preventDefault()}),document.getElementById("vehicles").addEventListener("change",function(e){e.preventDefault()}),document.getElementById("from").addEventListener("change",function(e){e.preventDefault()}),document.getElementById("to").addEventListener("change",function(e){e.preventDefault()}),document.getElementById("showHeatMap").addEventListener("click",function(e){e.preventDefault(),d()})},u=function(e,t){return(e=e.name.toLowerCase())===(t=t.name.toLowerCase())?0:t<e?1:-1};return{initialize:function(e,t,n){v=e,"geolocation"in navigator?navigator.geolocation.getCurrentPosition(function(e){a(e.coords),n()}):(a({longitude:-79.709441,latitude:43.434497}),n())},focus:function(e,t){(v=e).call("Get",{typeName:"Device",resultsLimit:5e4,search:{fromDate:(new Date).toISOString(),groups:t.getGroupFilter()}},function(e){!e||e.length<0||(e.sort(u),e.forEach(function(e){var t=new Option;t.text=e.name,t.value=e.id,y.add(t)}))},b),v.call("Get",{typeName:"Rule",resultsLimit:5e4},function(e){!e||e.length<0||(e.sort(u),e.forEach(function(e){var t=new Option;t.text=e.name,t.value=e.id,p.add(t)}))},b),setTimeout(function(){h.invalidateSize()},200)}}};