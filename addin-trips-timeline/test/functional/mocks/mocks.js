// Mocks of MyGeotab objects, these not the full objects, only what we need for our tests
var server = 'www.myaddin.com';
var user = {
  id: 'b1',
  language: 'en',
  firstName: 'Zom',
  lastName: 'Bie',
  name: 'zombie@underworld.dead',
  password: 'eat-the-living'
};
var login = {
  userName: user.name,
  password: user.password,
  database: 'zombie',
  server: server
};
var credentials = {
  credentials: {
    database: login.database,
    sessionId: '3225932739582116430',
    userName: login.userName,
    server: 'ThisServer'
  }
};
var device = {
  id: 'b1',
  licensePlate: 'ZOM B389',
  vehicleIdentificationNumber: 'AM32W8FV9BU601382',
  comment: 'Comment',
  name: 'Beefo',
  serialNumber: 'G70000000000'
};
var trip = {
	"afterHoursDistance": 12.4944611,
	"afterHoursDrivingDuration": "00:22:44",
	"afterHoursEnd": true,
	"afterHoursStart": true,
	"afterHoursStopDuration": "16:32:13",
	"averageSpeed": 32.97658,
	"distance": 12.4944611,
	"drivingDuration": "00:22:44",
	"idlingDuration": "00:00:00",
	"isSeatBeltOff": false,
	"maximumSpeed": 76,
	"nextTripStart": "2019-03-08T16:01:58.063Z",
	"speedRange1": 0,
	"speedRange1Duration": "00:00:00",
	"speedRange2": 0,
	"speedRange2Duration": "00:00:00",
	"speedRange3": 0,
	"speedRange3Duration": "00:00:00",
	"start": "2019-03-07T22:08:01.063Z",
	"stop": "2019-03-07T22:30:45.063Z",
	"stopDuration": "17:31:13",
	"stopPoint": {
		"x": -79.54488372802734,
		"y": 43.722164154052734
	},
	"workDistance": 0,
	"workDrivingDuration": "00:00:00",
	"workStopDuration": "00:59:00",
	"device": {
		"id": device.id
	},
	"driver": "UnknownDriverId",
	"id": "b5504186"
};

module.exports = {
  server: server,
  login: login,
  user: user,
  credentials: credentials,
  device: device,
  trip: trip
};
