#!/usr/bin/env node

/**
 * parser for acs platform
 * http://analyses.ezpaarse.org/platforms/acs/
 */
'use strict';
const Parser = require('../.lib/parser.js');

module.exports = new Parser(function analyseEC(parsedUrl) {
  let result = {};
  let path   = parsedUrl.pathname;
  let match;

  if ((match = /^\/(journal|loi|toc)\/([a-z]+[0-9]?)(\/current)?$/i.exec(path)) !== null) {
    // /journal/achre4
    // /toc/achre4/current
    result.title_id = match[2];
    result.unitid   = `${match[2]}${match[3] || ''}`;
    result.rtype    = 'TOC';
    result.mime     = 'HTML';

  } else if ((match = /^\/toc\/(([a-z]+[0-9]?)\/([0-9]+)\/([0-9]+))$/i.exec(path)) !== null) {
    // /toc/achre4/46/4
    result.rtype    = 'TOC';
    result.mime     = 'HTML';
    result.unitid   = match[1];
    result.title_id = match[2];
    result.vol      = match[3];
    result.issue    = match[4];

  } else if ((match = /^\/isbn\/([0-9]{13})$/i.exec(parsedUrl.pathname)) !== null) {
    // /isbn/9780841229105
    result.title_id         = match[1];
    result.unitid           = match[1];
    result.print_identifier = match[1];
    result.rtype            = 'TOC';
    result.mime             = 'HTML';

  } else if ((match = /^\/([a-z0-9]+)\/(article|article-abstract)\/doi\/(10\.[0-9]+\/([a-z0-9.-]+))\/[0-9]+(?:\/.*)?$/i.exec(path)) !== null) {
    // /acbcct/article-abstract/doi/10.1021/acschembio.6c00234/5254988/PhenoDEL-A-Novel-Screening-Strategy-Based-on
    // /ascecg/article-abstract/doi/10.1021/acssuschemeng.6c05800/5256064/Development-of-a-Polar-Tag-Platform-for
    result.title_id = match[1];
    result.doi      = match[3];
    result.unitid   = match[4];
    result.rtype    = /abstract$/i.test(match[2]) ? 'ABS' : 'ARTICLE';
    result.mime     = 'HTML';

  } else if ((match = /^\/([a-z0-9]+)\/(article|article-abstract)\/([0-9]+)\/([0-9]+)\/([0-9]+)\/([0-9]+)(?:\/.*)?$/i.exec(path)) !== null) {
    // /aamick/article-abstract/13/40/47728/575239/Realizing-Improved-Sodium-Ion-Storage-by
    // /ancac3/article/18/45/31381/151570/Controlled-Spalling-of-4H-Silicon-Carbide-with
    result.title_id   = match[1];
    result.vol        = match[3];
    result.issue      = match[4];
    result.first_page = match[5];
    result.unitid     = match[6];
    result.rtype      = /abstract$/i.test(match[2]) ? 'ABS' : 'ARTICLE';
    result.mime       = 'HTML';

  } else if ((match = /^\/doi(?:\/(abs|pdf|pdfplus|ipdf|epdf|full|book))?\/(10\.[0-9]+\/([a-z0-9.-]+))$/i.exec(path)) !== null) {
    // http://pubs.acs.org/doi/pdf/10.1021/acs.biochem.5b00764
    // http://pubs.acs.org/doi/full/10.1021/acs.biochem.5b00514
    // http://pubs.acs.org/doi/ipdf/10.1021/acs.biochem.5b00764
    // https://pubs.acs.org/doi/epdf/10.1021/acs.accounts.7b00114
    // https://pubs.acs.org/doi/book/10.1021/bk-1980-0135
    result.doi    = match[2];
    result.unitid = match[3];

    switch (result.unitid) {
    case 'undefined':
    case 'build-info.json':
      return {};
    }

    let doiMatch;

    if ((doiMatch = /^10\.[0-9]+\/([a-z0-9]+)-([0-9]{4})-[0-9]+\.ch0*([0-9]+)$/.exec(result.doi)) !== null) {
      // DOI de type 10.1021/bk-2012-1121.ch001
      result.title_id         = doiMatch[1];
      result.publication_date = doiMatch[2];
      result.chapter          = doiMatch[3];

    } else if ((doiMatch = /^10\.[0-9]+\/([a-z0-9]+)-([0-9]{4})-[0-9]+$/.exec(result.doi)) !== null) {
      // DOI d'un ouvrage complet, de type 10.1021/bk-1980-0135
      result.title_id         = doiMatch[1];
      result.publication_date = doiMatch[2];

    } else if ((doiMatch = /^10\.[0-9]+\/acs\.([a-z]+)\.[a-z0-9]+$/.exec(result.doi)) !== null) {
      // DOI de type 10.1021/acs.biochem.5b00764
      result.title_id = doiMatch[1];
    }

    switch (match[1]) {
    case 'abs':
      result.rtype = 'ABS';
      result.mime  = 'HTML';
      break;
    case 'book':
      result.rtype = 'BOOK';
      result.mime  = 'HTML';
      break;
    case 'pdf':
    case 'pdfplus':
    case 'ipdf':
    case 'epdf':
      result.rtype = result.chapter ? 'BOOK_SECTION' : 'ARTICLE';
      result.mime  = 'PDF';
      break;
    default:
      result.rtype = result.chapter ? 'BOOK_SECTION' : 'ARTICLE';
      result.mime  = 'HTML';
    }
  }

  return result;
});
