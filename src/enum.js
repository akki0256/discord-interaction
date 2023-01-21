const { createEnum } = require('./util/Util');

exports.SelectMenuType = createEnum([
  'String',
  'User',
  'Role',
  'Mentionable',
  'Channel',
]);
