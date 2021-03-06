/*
 *  Copyright 2016, Yahoo Inc.
 *  Licensed under the terms of the Apache License, Version 2.0.
 *  See the LICENSE file associated with the project for terms.
 */
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import RESULTS from 'bullet-ui/tests/fixtures/results';

module('Integration | Component | pivot table', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders a pivot table', async function(assert) {
    assert.expect(1);
    this.set('mockRows', RESULTS.GROUP_MULTIPLE_METRICS.records);
    this.set('mockColumns', ['foo', 'bar', 'COUNT', 'avg_bar', 'sum_foo']);
    this.set('mockOnRefresh', () => { });

    await render(hbs`<PivotTable @rows={{this.mockRows}} @columns={{this.mockColumns}}
                                 @initialOptions={{this.mockOptions}} @onRefresh={{this.mockOnRefresh}}/>`);
    assert.dom('.pvtUi select.pvtRenderer').hasValue('Table');
  });

  test('it generates options by combining defaults with provided options', async function(assert) {
    assert.expect(1);
    this.set('mockOnRefresh', config => {
      assert.equal(config.rendererName, 'Heatmap');
    });
    this.set('mockRows', RESULTS.GROUP_MULTIPLE_METRICS.records);
    this.set('mockColumns', ['foo', 'bar', 'COUNT', 'avg_bar', 'sum_foo']);
    this.set('mockOptions', { rendererName: 'Heatmap' });

    await render(hbs`<PivotTable @rows={{this.mockRows}} @columns={{this.mockColumns}}
                                 @initialOptions={{this.mockOptions}} @onRefresh={{this.mockOnRefresh}}/>`);
  });

  test('it removes certain options before returning the configuration', async function(assert) {
    assert.expect(4);
    this.set('mockOnRefresh', config => {
      assert.notOk(config.localeStrings);
      assert.notOk(config.aggregators);
      assert.notOk(config.renderers);
      assert.notOk(config.rendererOptions);
    });
    this.set('mockRows', RESULTS.GROUP_MULTIPLE_METRICS.records);
    this.set('mockColumns', ['foo', 'bar', 'COUNT', 'avg_bar', 'sum_foo']);
    this.set('mockOptions', { rendererOptions: { foo: 'bar' }, localeStrings: { bar: 'foo' } });

    await render(hbs`<PivotTable @rows={{this.mockRows}} @columns={{this.mockColumns}}
                                 @initialOptions={{this.mockOptions}} @onRefresh={{this.mockOnRefresh}}/>`);
  });
});
