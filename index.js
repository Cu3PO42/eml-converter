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

Q.all(Q.nfcall(glob, argv._[0]),
      Q.nfcall(fs.readFile, path.join(path.dirname(process.argv[1]), 'template.hbs'), 'r'))
.then(function(files) {
    if (argv.c) {
        Q.all(_.map(files, readMail)).then(function(mails) {
            var sortedMails = _.sortBy(mails, 'date'),
                filed = path.parse(files[0]);
            return render(sortedMails, template, path.join(filed.dir, filed.name));
        });
    } else {
        return Q.all(_.map(files, function(file) {
            return readMail(file).then(function(mail) {
                var filed = path.parse(file);
                return render([mail], template, path.join(filed.dir, filed.name));
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
    var html = template(mails);
    Q.all(Q.nfcall(fs.writeFile, outname + '.html', html),
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
    }).toFile, outname + '.pdf'));
}

hbs.registerHelper('formatDate', function(context, block) {
    return moment(Date(context)).lang('de').format('L');
});
