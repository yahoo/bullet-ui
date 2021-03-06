/*
 *  Copyright 2016, Yahoo Inc.
 *  Licensed under the terms of the Apache License, Version 2.0.
 *  See the LICENSE file associated with the project for terms.
 */
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import Table from 'ember-light-table';
import PaginatedTable from 'bullet-ui/components/paginated-table';

const RESULTS_TABLE_EXTRACTOR = EmberObject.create({
  created(row) {
    return row.get('created');
  },

  windows(row) {
    return row.get('windows.length');
  }
});

export default class ResultsTableComponent extends PaginatedTable {
  extractors = RESULTS_TABLE_EXTRACTOR;
  columns = A([
    { label: 'Date', valuePath: 'created', width: '150px', cellComponent: 'cells/result-date-entry' },
    { label: '# Windows', valuePath: 'windows', width: '85px', cellComponent: 'cells/result-number-entry' }
  ]);
  rows;

  constructor() {
    super(...arguments);
    this.table = Table.create({ columns: this.columns });
    this.rows = this.args.results.toArray();
    this.addPages(1);
  }
}
