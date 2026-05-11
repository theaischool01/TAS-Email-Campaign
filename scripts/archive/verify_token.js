const { UnsubscribeService } = require('./lib/services/unsubscribe');

const data = {
  cid: 'contact-123',
  cam: 'campaign-456',
  em: 'test@example.com'
};

const token = UnsubscribeService.encodeToken(data);
console.log('Encoded Token:', token);

const decoded = UnsubscribeService.decodeToken(token);
console.log('Decoded Data:', decoded);

if (decoded && decoded.cid === data.cid && decoded.cam === data.cam && decoded.em === data.em) {
  console.log('SUCCESS: Token loop is consistent.');
} else {
  console.log('FAILURE: Token loop is inconsistent!');
}
