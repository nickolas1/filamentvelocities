#!/usr/local/bin/perl

# add the following to .htaccess after running this
# to offer gzipped versions of static content:
# RewriteEngine on 
# RewriteCond %{HTTP:Accept-Encoding} gzip 
# RewriteCond %{REQUEST_FILENAME}.gz -f 
# RewriteRule ^(.*)$ $1.gz [L] 

use warnings;
use strict;
use File::Find;
find (\&wanted, ("."));
sub wanted
{
    if (/(.*\.(?:html|css|js|json|csv)$)/i) {
        print "Compressing $File::Find::name\n";
        if (! -f "$_.gz") {
            system ("gzip --keep --best --force $_");
        }
    }
}