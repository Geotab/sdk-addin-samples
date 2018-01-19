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

module.exports = {
  server: server,
  login: login,
  user: user,
  credentials: credentials,
  device: device
};
