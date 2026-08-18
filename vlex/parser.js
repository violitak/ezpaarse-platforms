#!/usr/bin/env node

'use strict';
const Parser = require('../.lib/parser.js');
const URL    = require('url');

/**
 * Recognizes the accesses to the platform vLex
 * @param  {Object} parsedUrl an object representing the URL to analyze
 *                            main attributes: pathname, query, hostname
 * @param  {Object} ec        an object representing the EC whose URL is being analyzed
 * @return {Object} the result
 */
module.exports = new Parser(function analyseEC(parsedUrl, ec) {
  let result = {};

  let match;

  // Legacy fragment form, kept so existing behaviour is preserved.
  // Fragments are client-side and never reach a server, so this branch
  // does not fire on proxy logs. See the path handling below.
  const hash = (parsedUrl.hash || '').replace('#', '');

  if (hash) {
    const hashedUrl = URL.parse(hash, true);

    if ((match = /^search\/([a-z:]+)\/([a-z]+)$/i.exec(hashedUrl.pathname)) !== null) {
      // https://app.vlex.com/#search/jurisdiction:CL/COVID
      result.rtype    = 'SEARCH';
      result.mime     = 'HTML';
      result.search_term = match[2];

      return result;

    } else if ((match = /^([a-z]+)?\/vid\/([0-9]+)$/i.exec(hashedUrl.pathname)) !== null) {
      // https://app.vlex.com/#/vid/877960841
      // https://app.vlex.com/#WW/vid/877911364
      result.rtype    = 'ARTICLE';
      result.mime     = 'HTML';
      result.unitid   = match[2];

      return result;
    }
  }

  // Server-visible paths, which is what appears in proxy logs.
  // Shape: /search/<facets>/<terms>[/pN]/vid/<id>
  const path = parsedUrl.pathname || '/';

  if ((match = /\/vid\/([0-9]+)$/i.exec(path)) !== null) {
    // https://app.vlex.com/search/jurisdiction:AR+content_type:4/libertad+de+expresion/vid/729674889
    // https://app.vlex.com/search/jurisdiction:AR+content_type:2/dano+moral/p2/vid/945610102
    result.rtype    = 'ARTICLE';
    result.mime     = 'HTML';
    result.unitid   = match[1];

  } else if (/^\/search\//i.test(path)) {
    // https://app.vlex.com/search/jurisdiction:AR,XM/13679%2F2025-CR
    result.rtype    = 'SEARCH';
    result.mime     = 'HTML';
  }

  // Everything else is deliberately left unrecognized so it is not counted
  // as content: the bare application root (a single page app landing page),
  // /account/login_ip (an IP recognition handshake, not an access) and
  // static assets.

  return result;
});
