#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    Q = require('q'),
    _ = require('lodash'),
    MailParser = require('mailparser').MailParser,
    hbs = require('handlebars'),
    moment = require('moment'),
    pdf = require('html-pdf'),
    argv = require('minimist')(process.argv.slice(2));

var template = hbs.compile(fs.readFileSync(path.join(__dirname, 'template.hbs'), {encoding: 'utf8'}));

Q.nfcall(glob, argv._[0])
.then(function(files) {
    if (argv.c) {
        Q.all(_.map(files, readMail)).then(function(mails) {
            var sortedMails = _.sortBy(mails, 'date');
            return render(sortedMails, template, path.join(path.dirname(files[0]), path.basename(files[0], '.eml')));
        });
    } else {
        return Q.all(_.map(files, function(file) {
            return readMail(file).then(function(mail) {
                var filed = path.parse(file);
                return render([mail], template, path.join(path.dirname(file), path.basename(file, '.eml')));
            });
        }));
    }
})
.done();

function readMail(filename) {
    var deferred = Q.defer(),
        parser = new MailParser();

    parser.on('end', function(mail) {
        deferred.resolve(mail);
    });

    fs.createReadStream(filename).pipe(parser);

    return deferred.promise;
}

function render(mails, template, outname) {
    var html = template({ mails: mails});
    /* return Q.all(Q.nfcall(fs.writeFile, outname + '.html', html),
          Q.nfcall( pdf.create(html, {
        format: 'A4',
        orientation: 'portrait',
        border: {
            top: '2cm',
            right: '0.8cm',
            bottom: '1.5cm',
            left: '0.8cm'
        },
        type: 'pdf'
    }).toFile, outname + '.pdf')); */
     fs.writeFileSync('/Users/Cu3PO42/Documents/emails.html', html);
}

hbs.registerHelper('formatDate', function(context, block) {
    return moment(context).locale('de').format('L');
});
