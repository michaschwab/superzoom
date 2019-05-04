import {NgModule} from '@angular/core';

@NgModule()
export class RunData
{
    idleTimeTotal: number = 0;
    panTimeTotal: number = 0;
    zoomInTimeTotal: number = 0;
    zoomOutTimeTotal: number = 0;
    taskTimeTotal: number = 0;
    idleTimes: number[] = [];
    panTimes: number[] = [];
    zoomInTimes: number[] = [];
    zoomOutTimes: number[] = [];
    taskTimes: number[] = [];
    zoomOutDurationsAfterZoomIn: number[] = [];
    maxRanges: number[] = [];
    countTasks: number = 0;
}
