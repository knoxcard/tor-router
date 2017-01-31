const dns = require('native-dns');
const UDPServer = require('native-dns').UDPServer;

class DNSServer extends UDPServer {
	constructor(tor_pool, logger, options, timeout) {
		super(options || {});
		this.logger = logger;
		this.tor_pool = tor_pool;

		this.on('request', (req, res) => {
			for (let question of req.question) {
				let dns_port = (tor_pool.next().dns_port);
				
				let outbound_req = dns.Request({
					question,
					server: { address: '127.0.0.1', port: dns_port, type: 'udp' },
					timeout: this.timeout
				});

				outbound_req.on('message', (err, answer) => {
					if (!err && answer) {
						for (let a of answer.answer){
							res.answer.push(a);
							this.logger && this.logger.info(`[dns]: ${question.name} type ${dns.consts.QTYPE_TO_NAME[question.type]} → 127.0.0.1:${dns_port} → ${JSON.stringify(a)}`)
						}
					}
				});	

				outbound_req.on('error', (err) => {

				});


				outbound_req.on('end', () => {
					res.send();
				});	

				outbound_req.send();
			}
		});
	}
};

module.exports = DNSServer;