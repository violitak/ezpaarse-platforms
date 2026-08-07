#!/usr/bin/env node

'use strict';
const Parser = require('../.lib/parser.js');

/**
 * Recognizes the accesses to the platform IPTECH
 * @param  {Object} parsedUrl an object representing the URL to analyze
 *                            main attributes: pathname, query, hostname
 * @param  {Object} ec        an object representing the EC whose URL is being analyzed
 * @return {Object} the result
 */
module.exports = new Parser(function analyseEC(parsedUrl, ec) {
  let result = {};
  let path   = parsedUrl.pathname;
  let match;

  // use console.error for debuging
  // console.error(parsedUrl);

  if (/^\/Search\/ValidateQuery$/i.test(path)) {
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
  } else if (/^\/Patent\/DownloadSinglePDF$/i.test(path)) {
    result.rtype = 'ARTICLE';
    result.mime  = 'PDF';
  } else if (/^\/Home\/Detail$/i.test(path) && /^#\/patent-info\//i.test(parsedUrl.hash)) {
    match = /[?&]esId=([^&]+)/.exec(parsedUrl.hash);
    if (match) {
      result.unitid = match[1];
      result.rtype  = 'ARTICLE';
      result.mime   = 'HTML';
    }
  }

  return result;
});
