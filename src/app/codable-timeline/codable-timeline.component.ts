/* tslint:disable */

import {
    Component, NgZone, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges,
    SimpleChange, AfterViewInit
} from "@angular/core";

import * as d3 from "d3";

@Component({
    selector: "codable-timeline",
    templateUrl: "codable-timeline.component.html",
    styleUrls: ["./codable-timeline.component.scss"]
})

export class CodableTimelineComponent implements    OnChanges, AfterViewInit
{
    private static readonly MS_PER_DAY = 24 * 3600 * 1000;

    @ViewChild("timelinecontainer") el : ElementRef;
    @Input() width : number;
    @Input() height : number;

    private visEl : any;
    //public x = d3.scaleTime();
    public primaryAxis = d3.scaleLinear();
    public x : any = () => 50;
    public y : any = () => 50;

    //private xAxis = d3.axisBottom(this.x).ticks(7);
    private xCurrentStart : number;
    private xCurrentEnd : number;
    private isBrowser = true;
    @Input() margin : {top : number, right : number, bottom : number, left : number};
    private zoomAnimationRunning = false;
    private nextZoomAnimationPossible = 0;

    public loaded = false;

    @Output() onReady = new EventEmitter<void>();
    @Output() onVisibleTimesChange = new EventEmitter<number[]>();

    // private mc : any;
    private indicatorTimes : number[] = [];

    private lastCalled = 0;
    private lastStart;
    private lastEnd;

    private isPanning = false;
    // private panningEnd = -1;

    private lastVisibleTimes = [];

    constructor(private zone: NgZone)
    {

    }

    setScales()
    {
        if(this.vertical)
        {
            this.x = () => 50;
            this.y = this.primaryAxis;
        }
        else
        {
            this.x = this.primaryAxis;
            this.y = () => 50;
        }
    }

    ngAfterViewInit()
    {
        this.setupAxis();
    }

    isVertical: boolean;

    @Input()
    set vertical(vertical: boolean)
    {
        this.isVertical = vertical;
        if(!this.visEl) return;
        this.setVisSize();
        this.setScales();
    }
    get vertical()
    {
        return this.isVertical;
    }
    
    rescaleTarget = { start: 0, end: 0 };

    @Input()
    set xStart(xStart: number)
    {
        if (isNaN(xStart))
        {
            return;
        }
        if (isNaN(this.xCurrentStart))
        {
            this.xCurrentStart = xStart;
            return;
        }

        if (Math.abs(this.xCurrentStart - xStart) > 0)
        {
            this.rescaleTarget.start = xStart;
            this.callAfterTimeoutOrSecondCall(() =>
            {
                this.rescale(this.rescaleTarget.start, this.rescaleTarget.end);
            }, 15);
        }
    }

    @Input()
    set xEnd(xEnd: number)
    {
        if (isNaN(xEnd))
        {
            return;
        }

        if (!this.xCurrentEnd)
        {
            this.xCurrentEnd = xEnd;
            return;
        }

        if (Math.abs(this.xCurrentEnd - xEnd) > 0)
        {
            this.rescaleTarget.end = xEnd;
            this.callAfterTimeoutOrSecondCall(() =>
            {
                this.rescale(this.rescaleTarget.start, this.rescaleTarget.end);
            }, 15);
        }
    }
    
    numberOfCalls = 0;
    callTimeout = null;
    lastCallTime = 0;
    
    callAfterTimeoutOrSecondCall(cb: () => void, timeout : number)
    {
        this.numberOfCalls++;
        
        if(Date.now() - this.lastCallTime > timeout)
        {
            this.numberOfCalls = 1;
        }
        
        if(this.numberOfCalls == 2)
        {
            this.lastCallTime = 0;
            this.numberOfCalls = 0;
            window.clearTimeout(this.callTimeout);
            cb();
        }
        else
        {
            this.lastCallTime = Date.now();
            this.callTimeout = window.setTimeout(cb, timeout);
        }
    }
    
    rescale(startDate, endDate)
    {
        let ratio = (this.xCurrentEnd - this.xCurrentStart) / (endDate - startDate);
        if(ratio < 1)
        {
            ratio *= 1;
        }
    
        if((ratio < 1.4 && ratio > 0.8) || this.zoomAnimationRunning || Date.now() < this.nextZoomAnimationPossible)
        {
            if(this.zoomAnimationRunning)
            {
                //console.log('cancelling zoom');
                this.cancelZoomAnimation();
                this.nextZoomAnimationPossible = Date.now() + 300;
                this.zoomAnimationRunning = false;
            }
        
            this.setXdomain(startDate, endDate);
        }
        else
        {
            //console.log('zooming');
            this.zoomAnimationRunning = true;
            this.zoom(this.xCurrentStart, startDate, this.xCurrentEnd, endDate, 400).then(() =>
                this.zoomAnimationRunning = false
            );
        }
    }

    ngOnChanges(changes: {[propKey: string]: SimpleChange})
    {
        if (this.height)
        {
            this.loadVis();
        }
    }

    setupAxis()
    {
        /*let formatMillisecond = d3.timeFormat(".%L"),
                formatSecond = d3.timeFormat(":%S"),
                formatMinute = d3.timeFormat("%I:%M"),
                formatHour = d3.timeFormat("%I %p"),
                formatDay = d3.timeFormat("%d"),
                formatWeek = d3.timeFormat("%d"),
                formatMonth = d3.timeFormat("%b"),
                formatYear = d3.timeFormat("%Y");

        function multiFormat(date) {
            return (d3.timeSecond(date) < date ? formatMillisecond
                    : d3.timeMinute(date) < date ? formatSecond
                            : d3.timeHour(date) < date ? formatMinute
                                    : d3.timeDay(date) < date ? formatHour
                                            : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
                                                    : d3.timeYear(date) < date ? formatMonth
                                                            : formatYear)(date);
        }

        this.xAxis.tickFormat(multiFormat);*/

        //this.xAxis.tickFormat(d3.format(",.0f"));
    }

    pxForRelativeTime(relativeTime: number): number
    {
        return this.primaryAxis(this.xCurrentStart + relativeTime) - this.primaryAxis(this.xCurrentEnd);
    }

    timeForRelativeMove(x: number) : number
    {
        let zeroX = this.primaryAxis(this.xCurrentStart);
        return this.primaryAxis.invert(zeroX - x) - this.xCurrentStart;
    }

    setVisEl()
    {
        this.visEl = d3.select(this.el.nativeElement);
    }

    loadVis()
    {
        if (this.loaded)
        {
            return;
        }

        this.setVisEl();
        this.setScales();
        this.setVisSize();
        this.initVis();
        this.onReady.emit();

        window.setTimeout(() =>
        {
            this.loaded = true;

        }, 1500);
    }

    initVis()
    {
        this.primaryAxis.domain([this.xCurrentStart, this.xCurrentEnd]);

        let axis = this.visEl.select("g.axis");

        axis.append("g")
                .attr("class", "axis axis--x");

        this.callAxis();
        this.setAxisPositions();
    }

    callAxis(): void
    {
        /*let axis = this.visEl.select("g.axis");

        axis.select(".axis.axis--x")
                .call(this.xAxis);*/
    }

    /*getRelativeEventPosition(event)
    {
        let x = event.clientX || event.touches[0].clientX;
        return x - this.el.nativeElement.getBoundingClientRect().left;
    }*/

    setAxisPositions()
    {
        if(!this.visEl) return;
        let axis = this.visEl.select("g.axis");
        axis.select(".axis--x").attr("transform", "translate(0," + (this.height - this.margin.bottom) + ")");
        axis.select(".axis--y").attr("transform", "translate(" + this.margin.left + ",0)");
    }

    setVisSize()
    {
        let range = this.vertical ? [this.margin.top, this.height - this.margin.bottom] : [this.margin.left, this.width - this.margin.right];
        this.primaryAxis.range(range);

        // console.log(this.xDomain)
        this.setAxisPositions();
    }

    zoom(currentStart, newStart, currentEnd, newEnd, duration = 800): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            let startInterpolator = d3.interpolate(currentStart, newStart);
            let endInterpolator = d3.interpolate(currentEnd, newEnd);

            d3.transition("zoom").duration(duration)
            .ease(t =>
            {
                let inBetweenStart = startInterpolator(t);
                let inBetweenEnd = endInterpolator(t);
                this.zone.run(() =>
                {
                    this.setXdomain(inBetweenStart, inBetweenEnd);
                });
                return t;
            })
            .on("end", () =>
            {
                this.zone.run(() =>
                {
                    this.setXdomain(newStart, newEnd);
                    resolve();
                });
            });
        });
    }
    
    cancelZoomAnimation()
    {
        d3.transition("zoom").duration(0);
    }

    setXdomain(xStart: number, xEnd: number)
    {
        this.primaryAxis.domain([xStart, xEnd]);
        this.xCurrentStart = xStart;
        this.xCurrentEnd = xEnd;
        this.callAxis();
        this.updateMonthInformer();

        this.updateVisibleTime();
    }

    updateMonthInformer()
    {
        /*let oneMonthInMs = CodableTimelineComponent.MS_PER_DAY * 30;
        let isLittleTime = this.xCurrentEnd.getTime() - this.xCurrentStart.getTime() < 3 * oneMonthInMs;
        let end = this.xCurrentEnd.getTime() + oneMonthInMs;
        this.indicatorTimes = [];

        if (isLittleTime)
        {
            for (let time = this.xCurrentStart.getTime(); time < end; time += oneMonthInMs)
            {
                this.indicatorTimes.push(this.getBeginningOfMonth(new Date(time)));
            }
        }*/
    }

    updateVisibleTime()
    {
        if (this.lastVisibleTimes[0] !== this.xCurrentStart || this.lastVisibleTimes[1] !== this.xCurrentEnd)
        {
            this.lastVisibleTimes = [this.xCurrentStart, this.xCurrentEnd];
            this.onVisibleTimesChange.emit(this.lastVisibleTimes);
        }
    }

    getBeginningOfMonth(date: Date): Date
    {
        return new Date(date.getFullYear(), date.getMonth());
    }

    isSameDate(date1, date2)
    {
        return date1.toDateString() === date2.toDateString();
    }
}
