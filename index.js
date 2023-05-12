var Xray = require('x-ray')
var { PythonShell } = require('python-shell')
var crypto = require('crypto');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf((info) => `${info.timestamp} - ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'changes.log' }),
  ],
});

var x = Xray({
  filters: {
    trim: function (value) {
      return value.replaceAll('\n', '')
    },

    woonplaats: function (value) {
      return value.replace('Apeldoorn', '')
    }
  }
})

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

x('https://www.rebohuurwoning.nl/nl/aanbod/?location=Apeldoorn&location_params=street%3DErasmusstraat%2B%2B95%26city%3DApeldoorn%26type%3Dcity&price_min=-1&price_max=-1&property_type=-1&property_subtype=-1&sorting=date_desc',
  '#properties_list .row .col', [
  {
    title: '.text | trim | woonplaats',
    link: 'a@href',
    image: 'img@src',
    price: '.details .price',
    lat: '.property@data-lat',
    lon: '.property@data-lng',
  }
])
  .then(r => {
    var paths = []

    r.forEach(d => paths.push(parse(d)))

    fs.readdirSync('./hashes').forEach(file => {
      var currentPath = `./hashes/${file}`

      if (!paths.includes(file)) {
        var obj = JSON.parse(fs.readFileSync(currentPath, 'utf-8'))
        send("Verwijderd:", obj.title, obj.price, obj.link)
        fs.rmSync(currentPath)
      }
    })

  })
  .catch(function (err) {
    console.log(err) 
  })


function parse(result) {
  var hash = crypto.createHash('md5').update(result.name + result.link).digest('hex')
  var path = `./hashes/${hash}.json`

  if (!fs.existsSync(path)) {
    var file = fs.openSync(path, 'w')
    fs.writeSync(file, JSON.stringify(result, null, 2), 0, 'utf-8')
    fs.closeSync(file)    
    
    send("Nieuw", result.title, result.price, result.link)
  }

  return `${hash}.json`;
}

function send(action, title, price, link) {
  logger.info(`${action} ${title}, ${price}, ${link}`);
  PythonShell.run('send.py', { args: [action + ": " + title + ", " + price, link] }, (err, results) => console.log(err, results))
}