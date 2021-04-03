var getUrl = function (targetClass, targetState) {
    var lcClassHtml = location.pathname.replace(/\./g, '/').toLowerCase(),
        url = document.URL,
        pos = url.toLowerCase().indexOf(lcClassHtml),
        encodedState = targetState ? '#' + rison.encode(targetState) : '';

    if (targetClass.indexOf('.') === -1) {
        targetClass = 'geotab.checkmate.ui.' + targetClass;
    }

    // This is the default scheme for standalone pages.
    targetClass = targetClass.replace(/\./g, '/');
    if (targetClass.toLowerCase() === lcClassHtml) {
        //staying on the same page - just replace hash component
        return url.replace(/\.html.*$/i, '.html' + encodedState);
    }
    return url.slice(0, pos) + targetClass + '.html' + encodedState;
};


const addin_state = {
    // Not available in myGeotab - addin use only.
    _activeGroups: [],
    getState: function () {
        var hash = location.hash,
            hashLength = hash.length;
        return !hashLength ? {} : rison.decode(location.hash.substring(1, location.hash.length));
    },
    setState: function (s) {
        location.hash = Object.keys(s).length ? '#' + rison.encode(s) : '';
    },
    gotoPage: function (page, args) {
        window.location = getUrl(page, args);
    },
    hasAccessToPage: function (page) {
        return !!page;
    },
    getGroupFilter: function () {
        return this._activeGroups;
    }
};

const mapaddin_state = {
    api: global.api,
    page: {
        go: (page, args) => {
            window.location = getUrl(page, args);
        }
    },
    events: {
        attach: () => {}
    },
    actionList: {
        attach: (type, callback) => {
            global.events.on(type, callback);
        },
        attachMenu: (menuId, callback) => {
            global.events.emit('actionListAttachMenu', { menuId, callback });
        }
    }
}

console.log(global.api);

let test = {"x":402,"y":402,"menuName":"vehicleMenu","location":{"lat":43.70495651999872,"lng":-79.83887479999999},"device":{"id":"b3"}};
let t = {"type":"device","entity":{"id":"b3"}};
module.exports = {...mapaddin_state, ...addin_state};