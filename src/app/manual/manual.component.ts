import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {CodableTimelineComponent} from '../codable-timeline/codable-timeline.component';
import {ZoomComponent} from '../zoomable/zoomable.component';
/* tslint:disable */
@Component({
    selector: 'manual-app',
    templateUrl: './manual.component.html',
    styleUrls: ['./manual.component.css']
})
export class ManualComponent implements    AfterViewInit
{
    @ViewChild("container") container : ElementRef;
    
    public static MODES = {'HOLD_ZOOM_IN': 0, 'HOLD_ZOOM_OUT': 1, 'CLICK_HOLD_ZOOM_IN': 2, 'CLICK_HOLD_ZOOM_OUT': 3, 'SIMPLE_PAN': 4, 'DBLCLICK_ZOOM_IN': 5, 'DBLCLICK_ZOOM_OUT': 6, 'DBLRIGHTCLICK_ZOOM_IN': 7, 'DBLRIGHTCLICK_ZOOM_OUT': 8, 'WHEEL_ZOOM': 9, 'WHEEL_PAN_X': 10, 'WHEEL_PAN_Y': 11, 'BRUSH_ZOOM_X': 12, 'BRUSH_ZOOM_Y': 13, 'BRUSH_ZOOM_2D': 14, 'DYNAMIC_ZOOM_X_STATIC': 15, 'DYNAMIC_ZOOM_X_ORIGINAL_PAN': 16, 'DYNAMIC_ZOOM_X_NORMAL_PAN': 17, 'DYNAMIC_ZOOM_X_ADJUSTABLE': 18, 'DYNAMIC_ZOOM_Y_STATIC': 19, 'DYNAMIC_ZOOM_Y_ORIGINAL_PAN': 20, 'DYNAMIC_ZOOM_Y_NORMAL_PAN': 21, 'DYNAMIC_ZOOM_Y_ADJUSTABLE': 22, 'PINCH_ZOOM': 23, 'PINCH_ZOOM_QUADRATIC': 24, 'PINCH_ZOOM_POWER_FOUR': 25, 'FLICK_PAN': 26, 'RUB_ZOOM_IN_X': 27, 'RUB_ZOOM_IN_Y': 28, 'RUB_ZOOM_OUT_X': 29, 'RUB_ZOOM_OUT_Y': 30, 'PINCH_PAN': 31, 'WHEEL_ZOOM_MOMENTUM': 32, 'PINCH_ZOOM_MOMENTUM': 33 };
    public allZoomModes = Object.keys(ManualComponent.MODES);
    
    start = 0;
    end = 20000000;
    numberMode = false;
    fixedStart = this.start;
    fixedEnd = this.end;
    //end = new Date();
    margin = {top: 30, right: 30, bottom: 60, left: 30};
    vertical = false;
    showOptions = false;
    //zoomModes = ['FLICK_PAN', 'RUB_ZOOM_OUT_Y', 'RUB_ZOOM_IN_X', 'WHEEL_ZOOM'];
    zoomModes = ['FLICK_PAN', 'WHEEL_ZOOM_MOMENTUM', 'PINCH_ZOOM_MOMENTUM'];
    //zoomModes = ['BRUSH_ZOOM_Y', 'PINCH_PAN', 'DBLCLICK_ZOOM_OUT'];
    //zoomModes = [];
    //zoomModes = ['DYNAMIC_ZOOM_X_ADJUSTABLE', 'FLICK_PAN', 'DBLCLICK_ZOOM', 'WHEEL_ZOOM'];
    //zoomModes = ['FLICK_PAN', 'DYNAMIC_ZOOM_X_NORMAL_PAN', 'PINCH_ZOOM_QUADRATIC', 'WHEEL_ZOOM'];
    //zoomModes = ['BRUSH_ZOOM_Y', 'WHEEL_ZOOM'];
    height = 0;
    width = 0;
    
    task_running = false;
    task_ran = false;
    taskTarget = 0;
    
    createRandomTarget()
    {
        this.taskTarget = Math.round(1 + this.fixedStart + Math.random() * (this.fixedEnd - this.fixedStart - 1));
        this.task_running = true;
        this.taskSelection = -1;
        this.taskSuccess = false;
    }
    
    taskSuccess = false;
    taskSelection = -1;
    targetClicked(number)
    {
        this.taskSelection = number;
    }
    
    confirmSelection()
    {
        this.taskSuccess = this.taskSelection == this.taskTarget;
        this.task_running = false;
        this.task_ran = true;
    }
    
    constructor()
    {
    
    }
    
    ngAfterViewInit()
    {
        window.setTimeout(() =>
        {
            this.width = this.container.nativeElement.clientWidth;
            this.height = this.container.nativeElement.clientHeight;
        });
    }
    
}
