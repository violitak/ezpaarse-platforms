#!/usr/bin/env node

'use strict';
const Parser = require('../.lib/parser.js');

/**
 * Recognizes the accesses to the platform Web of Science
 * @param  {Object} parsedUrl an object representing the URL to analyze
 *                            main attributes: pathname, query, hostname
 * @param  {Object} ec        an object representing the EC whose URL is being analyzed
 * @return {Object} the result
 */
module.exports = new Parser(function analyseEC(parsedUrl, ec) {
  let result = {};
  let path   = parsedUrl.pathname;
  let param  = parsedUrl.query || {};

  let match;

  if ((match = /^\/([a-z_]+)\.do$/i.exec(path)) !== null) {
    // /UA_GeneralSearch_input.do?product=UA&search_mode=GeneralSearch
    // /Search.do?product=UA&search_mode=GeneralSearch&prID=dcfade3d-550a-4076-92a6-bd6708e2c64c
    // /full_record.do?product=UA&search_mode=GeneralSearch&qid=14&page=1&doc=2
    // /InterService.do?product=WOS&toPID=WOS&action=AllCitationService&isLinks=yes&highlighted_tab=WOS&last_prod=WOS&fromPID=UA&search_mode=CitedRefList
    // /CitationReport.do?product=WOS&search_mode=CitationReport&SID=3B7nnGH8MSgIpEdYq5j&page=1&cr_pqid=3&viewType=summary&colName=WOS

    let productId = Array.isArray(param.product) ? param.product[0] : param.product;

    switch (match[1]) {
    case 'Search':
    case 'InterService' :
    case 'WOS_AdvancedSearch_input':
      result.rtype = 'SEARCH';
      result.mime  = 'HTML';
      if (productId) {
        result.db_id = productId;
      }
      break;
    case 'full_record' :
      result.rtype = 'RECORD_VIEW';
      result.mime  = 'HTML';
      if (productId) {
        result.db_id = productId;
      }
      break;
    case 'CitationReport' :
      result.rtype = 'ANALYSIS';
      result.mime  = 'MISC';
      if (productId) {
        result.db_id = productId;
      }
      break;
    }

    if (/^([a-z]+)_GeneralSearch_input/i.test(match[1])) {
      result.rtype = 'SEARCH';
      result.mime  = 'HTML';

      if (productId) {
        result.db_id = productId;
      }
    }
  } else if ((match = /^\/wos\/woscc\/full-record\/([a-z0-9:]+)$/i.exec(path)) !== null) {
    // /wos/woscc/full-record/WOS:000454372400003
    result.rtype  = 'RECORD_VIEW';
    result.mime   = 'HTML';
    result.unitid = match[1];
  } else if ((match = /^\/([a-zA-z_]*)\.action$/i.exec(path)) !== null) {
    // /JCRJournalHomeAction.action?
    // /JCRJournalProfileAction.action?
    // /IndicatorsAction.action?
    // /DocumentsAction.action
    // /JCRMasterSearchAction.action?pg=SEARCH&searchString=nature

    switch (match[1]) {
    case 'JCRJournalHomeAction':
      result.rtype = 'SEARCH';
      result.mime  = 'HTML';
      break;
    case 'JCRJournalProfileAction' :
      result.rtype = 'TABLE';
      result.mime  = 'HTML';

      if (param.journalTitle) {
        result.publication_title = param.journalTitle;
      }
      if (param.journal) {
        result.title_id = param.journal;
        result.unitid   = `impact/${param.journal}/${param.year}`;
      }
      break;
    case 'JCRMasterSearchAction':
      result.rtype = 'SEARCH';
      result.mime  = 'HTML';
      if (param.searchString) {
        result.unitid  = param.searchString;
      }
      break;
    case 'IndicatorsAction' :
      result.rtype = 'MAP';
      result.mime  = 'MISC';
      break;
    case 'DocumentsAction' :
      result.rtype = 'GRAPH';
      result.mime  = 'MISC';
      break;
    default:
      return {};
    }
  } else if ((match = /^\/([a-z]{2,3})\/analyze\.do$/i.exec(path)) !== null) {
    // /RA/analyze.do
    result.rtype = 'ANALYSIS';
    result.mime  = 'MISC';
  } else if ((match = /^\/[a-z-_]+\/(home|journal-profile)/i.exec(path)) !== null) {
    // /jif/home/?journal=NATURE&editions=SCIE&year=2017
    // /jcr-jp/journal-profile?journal=PHYS%20LIFE%20REV&year=2020&fromPage=%2Fjcr%2Fbrowse-journals
    result.rtype = 'ANALYSIS';
    result.mime  = 'HTML';
    if (param.journal) {
      result.unitid  = param.journal;
    }
    if (param.year) {
      result.publication_date  = param.year;
    }
  } else if (/^\/author\/search-results\/[a-z0-9-]+/i.test(path)) {
    // /author/search-results/a650b6d8-2f35-45c4-bef5-d65c38c26fff
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
    result.db_id = 'author';
  } else if ((match = /^\/author\/record\/([0-9]+)/i.exec(path)) !== null) {
    // /author/search-results/a650b6d8-2f35-45c4-bef5-d65c38c26fff
    result.rtype  = 'RECORD_VIEW';
    result.mime   = 'HTML';
    result.db_id  = 'author';
    result.unitid = match[1];
  } else if ((match = /^\/wos\/woscc\/summary\/(.+)$/i.exec(path)) !== null) {
    // /wos/woscc/summary/98d3b3c5-98aa-48b9-a80c-6be7017120ae-114647f4/relevance/1
    // /wos/woscc/summary/77df9780-cc32-45f0-89b4-7231d2cf2df4-01bb9e5b15/ee9180f0-20e3-4ff9-a224-e23dce90e23e-01bb9e5b04/relevance/1
    // /wos/woscc/summary/marked/date-descending/1
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
  } else if ((match = /^\/wos\/alldb\/(basic-search|advanced-search|smart-search)$/i.exec(path)) !== null) {
    // /wos/alldb/basic-search
    // /wos/alldb/advanced-search
    // /wos/alldb/smart-search
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
  } else if ((match = /^\/wos\/alldb\/full-record\/([a-z0-9:]+)$/i.exec(path)) !== null) {
    // /wos/alldb/full-record/WOS:000578373700001
    result.rtype  = 'RECORD_VIEW';
    result.mime   = 'HTML';
    result.unitid = match[1];
  } else if ((match = /^\/wos\/alldb\/citation-report\/([a-z0-9-]+)$/i.exec(path)) !== null) {
    // /wos/alldb/citation-report/09ae1f90-518d-4052-95a5-6836d874eea7-010e5e1519
    result.rtype  = 'ANALYSIS';
    result.mime   = 'HTML';
    result.unitid = match[1];
  } else if ((match = /^\/wos\/alldb\/summary\/(.+)$/i.exec(path)) !== null) {
    // /wos/alldb/summary/d0a90868-a364-4090-b572-5c81d1ea12ed-01719d6d0e/relevance/1
    // /wos/alldb/summary/marked/date-descending/1
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
  } else if ((match = /^\/wos\/woscc\/(basic-search|advanced-search|smart-search)$/i.exec(path)) !== null) {
    // /wos/woscc/basic-search
    // /wos/woscc/advanced-search
    // /wos/woscc/smart-search
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
  } else if ((match = /^\/wos\/woscc\/alert-execution-summary\/([a-z0-9-]+)$/i.exec(path)) !== null) {
    // /wos/woscc/alert-execution-summary/07557d43-ad71-4677-aae1-85b10cf6ba2b
    result.rtype  = 'SESSION';
    result.mime   = 'HTML';
    result.unitid = match[1];
  } else if (/^\/wos\/op\/publications\/(summary|import-publications)$/i.test(path)) {
    // /wos/op/publications/summary
    // /wos/op/publications/import-publications
    result.rtype = 'RECORD';
    result.mime  = 'HTML';
    result.db_id = 'op';
  } else if (/^\/wos\/author\/(my-profile|search)$/i.test(path)) {
    // /wos/author/my-profile
    // /wos/author/search
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
    result.db_id = 'author';
  } else if (/^\/wos\/author\/author-search$/i.test(path)) {
    // /wos/author/author-search
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
    result.db_id = 'author';
  } else if ((match = /^\/wos\/author\/record\/([a-z0-9-]+)$/i.exec(path)) !== null) {
    // /wos/author/record/1025488
    // /wos/author/record/A-9549-2008
    result.rtype  = 'RECORD_VIEW';
    result.mime   = 'HTML';
    result.db_id  = 'author';
    result.unitid = match[1];
  } else if ((match = /^\/wos\/author\/summary\/(.+)$/i.exec(path)) !== null) {
    // /wos/author/summary/b1012a46-b1c0-4e34-ba59-6e56c7196f73-01565411c1/doc-relevance/1
    result.rtype = 'SEARCH';
    result.mime  = 'HTML';
    result.db_id = 'author';
  }

  return result;
});
