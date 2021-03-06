/*
 *  Copyright 2018, Yahoo Inc.
 *  Licensed under the terms of the Apache License, Version 2.0.
 *  See the LICENSE file associated with the project for terms.
 */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';
import { action, get } from '@ember/object';
import { alias, and, or, not } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isNone } from '@ember/utils';
import WindowCache from 'bullet-ui/utils/window-cache';

// Tweaks the time for the window duration by this to adjust for Ember scheduling delays
const JITTER = -500;

export default class ResultViewerComponent extends Component {
  @service querier;

  @tracked selectedWindow;
  @tracked autoUpdate;
  @tracked timeSeriesMode;
  // Cache for windows to not recompute stuff if in the same mode
  cache;
  settings;

  // Computed Properties
  @alias('querier.isRunningQuery') isRunningQuery;
  @alias('args.result.isRaw') isRaw;
  @alias('args.result.hasData') hasData;
  @alias('args.result.hasError') hasError;
  @alias('args.result.errorWindow') errorWindow;
  @alias('args.result.hasNoWindow') hasNoWindow;
  @alias('args.result.isTimeWindow') isTimeWindow;
  @alias('args.result.windows.length') numberOfWindows;

  @not('hasError') hasNoError;
  @not('isTimeWindow') isRecordWindow;
  @and('isRecordWindow', 'isRaw') isRawRecordWindow;
  @alias('isRawRecordWindow') appendRecordsMode;
  @not('appendRecordsMode') notAppendRecordsMode;
  @or('appendRecordsMode', 'timeSeriesMode') aggregateMode;
  @and('hasData', 'hasNoError') showData;
  @and('showData', 'isTimeWindow') showTimeSeries;
  @and('showData', 'notAppendRecordsMode') showAutoUpdate;

  constructor() {
    super(...arguments);
    this.settings = getOwner(this).lookup('settings:main');
    this.cache = new WindowCache();
    this.reset();
  }

  get queryDuration() {
    let duration = this.args.result.get('queryDuration');
    if (isNone(duration)) {
      // Assume max duration if query had no duration
      return this.settings.get('defaultValues.durationMaxSecs') * 1000;
    }
    return duration;
  }

  get windowDuration() {
    return JITTER + this.args.result.get('windowEmitEvery');
  }

  get config() {
    return {
      isRaw: this.args.result.get('isRaw'),
      isReallyRaw: this.args.result.get('isReallyRaw'),
      isDistribution: this.args.result.get('isDistribution'),
      isSingleRow: this.args.result.get('isSingleRow')
    };
  }

  get metadata() {
    return this.hasError ? this.errorWindow.metadata : this.getSelectedWindow('metadata', this.autoUpdate);
  }

  get records() {
    if (this.appendRecordsMode) {
      return this.getAllWindowRecords();
    }
    if (this.timeSeriesMode) {
      return this.autoUpdate ? this.getTimeSeriesRecords() : this.getAllAvailableRecords();
    }
    return this.getSelectedWindow('records', this.autoUpdate);
  }

  getSelectedWindow(property, autoUpdate) {
    let windowProperty = get(this.args, `result.windows.lastObject.${property}`);
    if (!autoUpdate && !isNone(this.selectedWindow)) {
      windowProperty = this.selectedWindow[property];
    }
    return windowProperty;
  }

  getAllAvailableRecords() {
    return this.cache.getAllAvailableRecords();
  }

  getAllWindowRecords() {
    let windows = get(this.args, 'result.windows');
    return this.cache.getAllRecordsFrom(windows);
  }

  getTimeSeriesRecords() {
    let windows = get(this.args, 'result.windows');
    return this.cache.getAllTimeSeriesRecordsFrom(windows);
  }

  @action
  reset() {
    this.selectedWindow = null;
    this.autoUpdate = true;
    this.timeSeriesMode = false;
    this.cache.reset();
  }

  @action
  changeWindow(selectedWindow) {
    this.selectedWindow = selectedWindow;
    this.autoUpdate = false;
  }

  @action
  changeAutoUpdate(autoUpdate) {
    this.autoUpdate = autoUpdate;
    // Turn On or if aggregating (and turn off) => reset selectedWindow. Turn Off => Last window
    let aggregateMode = this.aggregateMode;
    this.selectedWindow = autoUpdate || aggregateMode ? null : this.args.result.get('windows.lastObject');
  }

  @action
  changeTimeSeriesMode(timeSeriesMode) {
    // Reset the cache if we don't have autoupdate on in timeSeriesMode to avoid confusion and pull the latest data
    if (timeSeriesMode && !this.autoUpdate) {
      this.cache.reset();
      this.getTimeSeriesRecords();
    }
    this.timeSeriesMode = timeSeriesMode;
    this.selectedWindow = timeSeriesMode || this.autoUpdate ? null : this.args.result.get('windows.lastObject');
  }
}
