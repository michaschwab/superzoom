import {Component, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {CodableTimelineComponent} from '../codable-timeline/codable-timeline.component';
import {ZoomComponent} from '../zoomable/zoomable.component';
import {AnimationService} from "../../services/animation.service";
/* tslint:disable */
@Component({
    selector: 'numbervis',
    templateUrl: './number-vis.component.html',
    styleUrls: ['./number-vis.component.scss']
})
export class NumberVisComponent
{
    public static NORMAL_SIZE = 1000;
    public static MAX_CLICK_DURATION = 200;
    
    start = 0;
    end;
    fixedStart = this.start;
    fixedEnd = this.end;
    
    touching = false;
    mouseDownTime = 0;
    
    @Input() margin : { top: number, right: number, bottom: number, left: number };
    @Input() height : number;
    @Input() width : number;
    @Input() target: number;
    
    @Output() targetClicked = new EventEmitter<{number: number, dateNumbers: { year: number, month: number, day: number, hour: number, minute: number }, bbox: {width: number, height: number, x: number, y: number}}>();
    @Output() zoomedIn = new EventEmitter<{relativeChange: number, rangeStart: number, rangeEnd: number}>();
    @Output() zoomedOut = new EventEmitter<{relativeChange: number, rangeStart: number, rangeEnd: number}>();
    @Output() panned = new EventEmitter<{rangeChange: number, rangeStart: number, rangeEnd: number}>();

    @ViewChild(CodableTimelineComponent)
    private timeline: CodableTimelineComponent;
    
    DATE_SCALE = 60000;
    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    

    onVisibleTimesChange(dates)
    {
        this.start = dates[0];
        this.end = dates[1];
        //this.updateTimeDataPoints();
        this.defineCurrentlyVisible();
    }
    
    @HostListener('mousedown', ['$event']) onMouseDown(event: TouchEvent)
    {
        this.mouseDownTime = Date.now();
    }
    
    @HostListener('touchstart', ['$event']) onTouchStart(event: TouchEvent)
    {
        this.touching = true;
        this.mouseDownTime = Date.now();
    }
    @HostListener('touchend', ['$event']) onTouchEnd(event: TouchEvent)
    {
        this.touching = false;
        this.deleteHiddenElements();
    }

    animationService: AnimationService;

    constructor(animationService: AnimationService)
    {
        this.animationService = animationService;
    }
    taskSelection = 0;

    isVertical: boolean;
    
    @Input() numberMode : boolean;
    
    @Input()
    set resetSelection(resetSelection: number)
    {
        this.taskSelection = null;
    }
    
    @Input()
    set resetScale(number: number)
    {
        if(number)
        {
            this.start = this.fixedStart;
            this.end = this.fixedEnd;
        }
    }
    
    @Input()
    set lastNumber(number: number)
    {
        this.end = number;
        this.fixedEnd = number;
        //this.numbers = Array.from(Array(this.end).keys());
    }

    @Input()
    set vertical(vertical: boolean)
    {
        this.isVertical = vertical;
    }
    get vertical()
    {
        return this.isVertical;
    }

    currentZoomModes: string[];

    @Input()
    set zoomModes(zoomModes: string[])
    {
        this.currentZoomModes = zoomModes;
    }
    get zoomModes()
    {
        return this.currentZoomModes;
    }

    onTargetClicked(number: number, event: PointerEvent, dateObj?: { titles: string[], short: string, start: number, end: number, roundedStart: number, roundedEnd: number })
    {
        if(Date.now() - this.mouseDownTime <= NumberVisComponent.MAX_CLICK_DURATION)
        {
            let target = <SVGRectElement> event.target;
            let bbox = target.getBBox();
            this.taskSelection = number;
            let dateNumbers = null;
    
            if(dateObj)
            {
                let americanHour = parseInt(dateObj.titles[1].split(':')[0]);
                let amPm = dateObj.titles[1].split(' ')[1];
                let hour = amPm === 'pm' && americanHour !== 12 ? americanHour + 12 : americanHour;
                if(hour === 12 && amPm === 'am') hour = 0;
    
                dateNumbers = {
                    year: parseInt(dateObj.titles[0]),
                    month: this.MONTH_NAMES.indexOf(dateObj.titles[2].substr(0,3)),
                    day: parseInt(dateObj.titles[2].substr(4)),
                    hour: hour,
                    minute: parseInt(dateObj.titles[1].split(':')[1].split(' ')[0]),
                };
            }
            
            this.targetClicked.emit({number: number, bbox: bbox, dateNumbers: dateNumbers});
        }
    }
    
    getHardStartEnd()
    {
        let diff = this.fixedEnd - this.fixedStart;
        let wiggleRoomPercentage = 0.25;
        let hardStopStart = this.fixedStart - diff * wiggleRoomPercentage;
        let hardStopEnd = this.fixedEnd + diff * wiggleRoomPercentage;
        
        return {start: hardStopStart, end: hardStopEnd};
    }

    onPanned(movement: {x: number, y: number})
    {
        let primaryAxisMovement = this.vertical ? movement.y : movement.x;
        let pannedByMs = this.timeline.timeForRelativeMove(primaryAxisMovement);
        let newStart = this.start + pannedByMs;
        let newEnd = this.end + pannedByMs;
        
        if(newStart >= this.getHardStartEnd().start && newEnd <= this.getHardStartEnd().end)
        {
            this.start = newStart;
            this.end = newEnd;
    
            this.panned.emit({rangeChange: pannedByMs, rangeStart: this.start, rangeEnd: this.end});
        }
    }

    absoluteStart = 0;
    timeDiff = 0;

    resetAbsoluteScale()
    {
        this.absoluteStart = this.start;
        this.timeDiff = this.end - this.start;
    }

    rescaleDomain(x: number, percentageChange: number, absolutePercentageChange?: number, targetX?: number) : {start: number, end: number}
    {
        let startingXPosition = this.timeline.primaryAxis(this.start);
        let margin = this.vertical ? this.margin.top : this.margin.left;
        let xStart = this.timeline.primaryAxis.invert(x - startingXPosition + margin);
        let range = this.timeline.primaryAxis.range();
        let newtotalDays;
        let newStart;
        let newEnd;
        let timeDiff;
        let selectPercentage;

        if(absolutePercentageChange)
        {
            let domain = this.timeline.primaryAxis.domain();
            this.timeline.primaryAxis.domain([this.absoluteStart, this.absoluteStart + this.timeDiff]);
            xStart = this.timeline.primaryAxis.invert(x);
            this.timeline.primaryAxis.domain(domain);
            
            timeDiff = this.timeDiff;
            newtotalDays = timeDiff * absolutePercentageChange;
            selectPercentage = (xStart - this.absoluteStart) / timeDiff;
        }
        else
        {
            timeDiff = this.end - this.start;
            newtotalDays = timeDiff * percentageChange;
            selectPercentage = (xStart - this.start) / timeDiff;
        }
    
        if(targetX)
        {
            let rangeDiff = range[1] - range[0];
            selectPercentage = (targetX - range[0]) / rangeDiff;
        }

        newStart = xStart - selectPercentage * newtotalDays;
        newEnd = newStart + newtotalDays;
        
        let diff = newEnd-newStart;
        let hardStartEnd = this.getHardStartEnd();
        
        if(diff < hardStartEnd.end - hardStartEnd.start && diff > 2)
        {
            if(newStart < hardStartEnd.start)
            {
                //console.log(newStart, hardStartEnd.start);
                newEnd += hardStartEnd.start - newStart;
                newStart = hardStartEnd.start;
            }
            if(newEnd > hardStartEnd.end)
            {
                //console.log('cut off end');
                newStart -= newEnd - hardStartEnd.end;
                newEnd = hardStartEnd.end;
            }
            
            return {start: newStart, end: newEnd};
        }
        else
        {
            //console.log('complete block');
            return {start: this.start, end: this.end};
        }
    }
    
    cappedNumber(number)
    {
        if(number >= this.start && number <= this.end) return number;
        if(number < this.start) return this.start;
        return this.end;
    }
    

    onZoomed(movement: {x: number, y: number, scaleChange?: number, absoluteScaleChange?: number, targetX?: number, targetY?: number})
    {
        let primaryAxisMovement = this.vertical ? movement.y : movement.x;
        let primaryAxisTarget = this.vertical ? movement.targetY : movement.targetX;
        let newDomain = this.rescaleDomain(primaryAxisMovement, movement.scaleChange, movement.absoluteScaleChange, primaryAxisTarget);
        
        const previousStart = this.start;
        this.start = newDomain.start;
        this.end = newDomain.end;
    
        let mainScaleChange = isNaN(movement.scaleChange) ? movement.absoluteScaleChange : movement.scaleChange;
        
        if(mainScaleChange == 1)
        {
            this.panned.emit({rangeChange: previousStart - this.start, rangeStart: this.start, rangeEnd: this.end});
        }
        else
        {
            let eventEmittor = mainScaleChange < 1 ? this.zoomedIn : this.zoomedOut;
            eventEmittor.emit({relativeChange: mainScaleChange, rangeStart: this.start, rangeEnd: this.end});
        }
        
    }

    visibleNumbers : number[];
    visibleNumberTimes = {};
    visibleDateObjects : { title: string, short: string, start: number, end: number, roundedStart: number, roundedEnd: number }[] = [];
    visibleParentDateObjects : { title: string, short: string, start: number, end: number, roundedStart: number, roundedEnd: number }[] = [];
    visibleDateIndicatorObjects : { title: string, short: string, start: number, end: number, roundedStart: number, roundedEnd: number }[] = [];

    defineCurrentlyVisible()
    {
        this.visibleNumbers = [];
        this.rectNumbers = [];

        if(this.numberMode)
        {
            this.visibleDateObjects = [];
            this.visibleParentDateObjects = [];
            this.visibleDateIndicatorObjects = [];
            this.defineCurrentlyVisibleNumbers();
        }
        else
        {
            this.defineCurrentlyVisibleDates();
        }
    }
    
    defineCurrentlyVisibleDates()
    {
        let diff = this.end - this.start;
        
        let secondMS = 1000;
        let minuteMS = 60 * secondMS;
        let hourMS = 60 * minuteMS;
        let dayMS = 24 * hourMS;
        let monthMS = 30 * dayMS;
        let yearMS = 365 * dayMS;
    
        let loopOverTime = (stepSizeInMs, callback: (number, year, month, day, hour, americanHour, amPm, minute) => void) =>
        {
            let addNumber = (number) =>
            {
                let date = new Date(number * this.DATE_SCALE); //TODO make UTC?
                let year = date.getUTCFullYear();
                let month = date.getUTCMonth();
                let day = date.getUTCDate();
                let hour = date.getUTCHours();
                let amPm = hour >= 12 ? 'pm' : 'am';
                let americanHour = hour % 12;
                if(americanHour == 0) americanHour = 12;
                let minute = date.getUTCMinutes();
                callback(number, year, month, day, hour, americanHour, amPm, minute);
            };
            const step = Math.round(stepSizeInMs * 0.8 / this.DATE_SCALE);
            //const offset = new Date(Math.round(this.start) - step).getTimezoneOffset();
            for(let number = Math.round(this.start) - step; number <= this.end + step; number += step)
            {
                addNumber(number);
            }
            addNumber(Math.round(this.end));
        };
        
        let makeDateObj = (number, dateStart : number, dateEnd : number, roundedStart : number, roundedEnd : number, titles, short, type) =>
        {
            let start = dateStart / this.DATE_SCALE;
            let end = dateEnd / this.DATE_SCALE;
            let labelPosFactor = 1;
            
            //if(type === 'hour' || type === 'minute')
            if(type === 'hour')
            {
                labelPosFactor = 0;
            }
    
            roundedStart = start;
            roundedEnd = end;
            
            return {number: number, start: start, end: end, roundedStart: roundedStart, roundedEnd: roundedEnd, labelPosFactor: labelPosFactor, titles: titles, short: short, type: type};
        };
        
        let addIfNotThere = (data, dateObj) =>
        {
            let id = this.dateId(dateObj);
            if(!data[id])
                data[id] = dateObj;
        };
    
        let getCenturies = () => getNyears(100, 'century', 's');
        let getFiveDecades = () => getNyears(50, 'five-decade', 's');
        let getDecades = () => getNyears(10, 'decade', 's');
        let getYears = () => getNyears(1, 'year');
        
        let getNyears = (n, type, labelAddendum = '') =>
        {
            let data = {};
            loopOverTime(yearMS* n, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                let roundedYear = Math.round(year / n) * n;
                let halfN = Math.round(n / 2);
                let roundedStart = Date.UTC(roundedYear-halfN, 6);
                let roundedEnd = Date.UTC(roundedYear+halfN-1, 5, daysInMonth(roundedYear+halfN-1, 5), 23, 59, 59, 999);
                let start = Date.UTC(roundedYear, 0);
                let end = Date.UTC(roundedYear+n-1, 11, daysInMonth(roundedYear+n-1, 11), 23, 59, 59, 999);
                let label = roundedYear.toString() + labelAddendum;
                addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [label], label, type));
            });
            return Object.keys(data).map(key => data[key]);
        };
    
        let getThreeMonths = () =>
        {
            let data = {};
            loopOverTime(monthMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                if(month % 3 === 0)
                {
                    let roundedStart = Date.UTC(year, month-1, 16);
                    let roundedEnd = Date.UTC(year, month, 15, 23, 59, 59, 999);
                    let start = Date.UTC(year, month);
                    let end = Date.UTC(year, month, daysInMonth(year, month), 23, 59, 59, 999);
                    addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year.toString(), this.MONTH_NAMES[month]], this.MONTH_NAMES[month], 'month'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let daysInMonth = (year, month) =>
        {
            return new Date(year, month+1, 0).getDate();
        };
        
        let getMonths = () =>
        {
            let data = {};
            loopOverTime(monthMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                let roundedStart = Date.UTC(year, month-1, 16);
                let roundedEnd = Date.UTC(year, month, 15, 23, 59, 59, 999);
                let start = Date.UTC(year, month);
                let end = Date.UTC(year, month, daysInMonth(year, month), 23, 59, 59, 999);
                addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year.toString(), this.MONTH_NAMES[month]], this.MONTH_NAMES[month], 'month'));
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getPartialMonth = () =>
        {
            let data = {};
            loopOverTime(dayMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                if(day == 1 || day == 11 || day == 21)
                {
                    let roundedStart = Date.UTC(year, month, day-1, 12);
                    let roundedEnd = Date.UTC(year, month, day, 11, 59, 59, 999);
                    let start = Date.UTC(year, month, day);
                    let end = Date.UTC(year, month, day, 23, 59, 59, 999);
                    let label = this.MONTH_NAMES[month] + ' ' + day;
                    addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, this.MONTH_NAMES[month] + ' ' + day.toString()], label, 'day'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
    
        let getFiveDays = () =>
        {
            let data = {};
            loopOverTime(dayMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                if(day == 1 || day == 6 || day == 11 || day == 16 || day == 21 || day == 26)
                {
                    let roundedStart = Date.UTC(year, month, day-1, 12);
                    let roundedEnd = Date.UTC(year, month, day, 11, 59, 59, 999);
                    let start = Date.UTC(year, month, day);
                    let end = Date.UTC(year, month, day, 23, 59, 59, 999);
                    let label = this.MONTH_NAMES[month] + ' ' + day;
                    addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, this.MONTH_NAMES[month] + ' ' + day.toString()], label, 'day'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getDays = () =>
        {
            let data = {};
            loopOverTime(dayMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                let roundedStart = Date.UTC(year, month, day-1, 12);
                let roundedEnd = Date.UTC(year, month, day, 11, 59, 59, 999);
                let start = Date.UTC(year, month, day);
                let end = Date.UTC(year, month, day, 23, 59, 59, 999);
                addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, this.MONTH_NAMES[month] + ' ' + day.toString()], this.MONTH_NAMES[month] + ' ' + day, 'day'));
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getPartialDays =() =>
        {
            let data = {};
            loopOverTime(hourMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                if(americanHour % 6 == 0)
                {
                    let roundedStart = Date.UTC(year, month, day, hour-1, 30);
                    let roundedEnd = Date.UTC(year, month, day, hour, 29, 59, 999);
                    let start = Date.UTC(year, month, day, hour);
                    let end = Date.UTC(year, month, day, hour, 59, 59, 999);
                    let label = americanHour + ' ' + amPm;
                    addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, americanHour + ' ' + amPm, this.MONTH_NAMES[month] + ' ' + day.toString()], label, 'hour'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getHours = () =>
        {
            let data = {};
            loopOverTime(hourMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                let roundedStart = Date.UTC(year, month, day, hour-1, 30);
                let roundedEnd = Date.UTC(year, month, day, hour, 29, 59, 999);
                let start = Date.UTC(year, month, day, hour);
                let end = Date.UTC(year, month, day, hour, 59, 59, 999);
                addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, americanHour + ' ' + amPm, this.MONTH_NAMES[month] + ' ' + day.toString()], americanHour + ' ' + amPm, 'hour'));
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getPartialHours = () =>
        {
            let data = {};
            loopOverTime(minuteMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                //if(minute % 15 === 0)
                {
                    let roundedStart = Date.UTC(year, month, day, hour, minute);
                    let roundedEnd = Date.UTC(year, month, day, hour, minute, 59, 999);
                    let start = Date.UTC(year, month, day, hour, minute);
                    let end = Date.UTC(year, month, day, hour, minute, 59, 999);
                    //let label = americanHour + ':' + minuteString(minute);
                    let label = minute % 15 === 0 ? americanHour + ':' + minuteString(minute) + ' ' + amPm : '';
                    addIfNotThere(data, makeDateObj(number, start, end, roundedStart, roundedEnd, [year, americanHour + ':' + minuteString(minute) + ' ' + amPm, this.MONTH_NAMES[month] + ' ' + day.toString()], label, 'minute'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
    
        let getFiveMinutes = () =>
        {
            let data = {};
            loopOverTime(minuteMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                //if(minute % 15 === 0)
                {
                    let start = Date.UTC(year, month, day, hour, minute);
                    let end = Date.UTC(year, month, day, hour, minute, 59, 999);
                    //let label = americanHour + ':' + minuteString(minute);
                    let label = minute % 5 === 0 ? americanHour + ':' + minuteString(minute) + ' ' + amPm : '';
                    addIfNotThere(data, makeDateObj(number, start, end, start, end, [year, americanHour + ':' + minuteString(minute) + ' ' + amPm, this.MONTH_NAMES[month] + ' ' + day.toString()], label, 'minute'));
                }
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let getMinutes = () =>
        {
            let data = {};
            loopOverTime(minuteMS, (number, year, month, day, hour, americanHour, amPm, minute) =>
            {
                let start = Date.UTC(year, month, day, hour, minute);
                let end = Date.UTC(year, month, day, hour, minute, 59, 999);
                addIfNotThere(data, makeDateObj(number, start, end, start, end, [year, americanHour + ':' + minuteString(minute) + ' ' + amPm, this.MONTH_NAMES[month] + ' ' + day.toString()], americanHour + ':' + minuteString(minute) + ' ' + amPm, 'minute'));
            });
            return Object.keys(data).map(key => data[key]);
        };
        
        let minuteString = (minute: number)  : string =>
        {
            return minute < 10 ? '0' + minute : minute.toString();
        };
        
        let updateArray = (oldArray, newArray) =>
        {
            let oldNumbers = oldArray.map(a => this.dateId(a));
            let newNumbers = newArray.map(a => this.dateId(a));
            let deletedNumbers = oldNumbers.filter(number => newNumbers.indexOf(number) === -1);
            for(let deletedNumber of deletedNumbers)
            {
                let index = oldArray.map(a => this.dateId(a)).indexOf(deletedNumber);
                //if(!this.touching)
                {
                    oldArray.splice(index, 1);
                }
                //else
                {
                    //oldArray[index]['deleted'] = true;
                }
            }
            let addedNumbers = newNumbers.filter(number => oldNumbers.indexOf(number) === -1);
            for(let addedNumber of addedNumbers)
            {
                oldArray.push(newArray[newNumbers.indexOf(addedNumber)]);
            }
            
            let deletingNumbers = oldArray.filter(dateObj => dateObj['deleted']).map(a => this.dateId(a));
            let falselyDeletingNumbers = deletingNumbers.filter(deletingNumber => newNumbers.indexOf(deletingNumber) !== -1);
            for(let falselyDeletingNumber of falselyDeletingNumbers)
            {
                let index = oldArray.map(a => this.dateId(a)).indexOf(falselyDeletingNumber);
                delete oldArray[index].deleted;
            }
        };
    
        const sizeScalingFactor = this.vertical ? NumberVisComponent.NORMAL_SIZE / this.height : NumberVisComponent.NORMAL_SIZE / this.width;
        
        if(diff * this.DATE_SCALE * sizeScalingFactor > yearMS * 500)
        {
            updateArray(this.visibleDateObjects, getCenturies());
            updateArray(this.visibleDateIndicatorObjects, getCenturies());
            this.visibleParentDateObjects = [];
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > yearMS * 200)
        {
            updateArray(this.visibleDateObjects, getFiveDecades());
            updateArray(this.visibleDateIndicatorObjects, getFiveDecades());
            this.visibleParentDateObjects = [];
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > yearMS * 25)
        {
            updateArray(this.visibleDateObjects, getDecades());
            updateArray(this.visibleDateIndicatorObjects, getYears());
            updateArray(this.visibleParentDateObjects, getDecades());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > yearMS * 4)
        {
            updateArray(this.visibleDateObjects, getYears());
            updateArray(this.visibleDateIndicatorObjects, getYears());
            updateArray(this.visibleParentDateObjects, getDecades());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > yearMS * 2)
        {
            updateArray(this.visibleDateObjects, getThreeMonths());
            updateArray(this.visibleDateIndicatorObjects, getMonths());
            updateArray(this.visibleParentDateObjects, getYears());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > monthMS * 6)
        {
            updateArray(this.visibleDateObjects, getMonths());
            updateArray(this.visibleDateIndicatorObjects, getMonths());
            updateArray(this.visibleParentDateObjects, getYears());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > dayMS * 40)
        {
            updateArray(this.visibleDateObjects, getPartialMonth());
            updateArray(this.visibleDateIndicatorObjects, getDays());
            updateArray(this.visibleParentDateObjects, getMonths());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > dayMS * 15)
        {
            updateArray(this.visibleDateObjects, getFiveDays());
            updateArray(this.visibleDateIndicatorObjects, getDays());
            updateArray(this.visibleParentDateObjects, getMonths());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > dayMS * 3)
        {
            updateArray(this.visibleDateObjects, getDays());
            updateArray(this.visibleDateIndicatorObjects, getDays());
            updateArray(this.visibleParentDateObjects, getMonths());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > hourMS * 20)
        {
            updateArray(this.visibleDateObjects, getPartialDays());
            updateArray(this.visibleDateIndicatorObjects, getHours());
            updateArray(this.visibleParentDateObjects, getDays());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > hourMS * 3)
        {
            updateArray(this.visibleDateObjects, getHours());
            updateArray(this.visibleDateIndicatorObjects, getHours());
            updateArray(this.visibleParentDateObjects, getDays());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > hourMS * 0.8)
        {
            updateArray(this.visibleDateObjects, getPartialHours());
            updateArray(this.visibleDateIndicatorObjects, getMinutes());
            updateArray(this.visibleParentDateObjects, getDays());
        }
        else if(diff * this.DATE_SCALE * sizeScalingFactor > hourMS * 0.2)
        {
            updateArray(this.visibleDateObjects, getFiveMinutes());
            updateArray(this.visibleDateIndicatorObjects, getMinutes());
            updateArray(this.visibleParentDateObjects, getDays());
        }
        else
        {
            updateArray(this.visibleDateObjects, getMinutes());
            updateArray(this.visibleDateIndicatorObjects, getMinutes());
            updateArray(this.visibleParentDateObjects, getDays());
        }
    }
    
    deleteHiddenElements()
    {
        let deletedElements = this.visibleDateObjects.filter(dateObj => dateObj['deleted']);
        for(let deletedElement of deletedElements)
        {
            let index = this.visibleDateObjects.indexOf(deletedElement);
            this.visibleDateObjects.splice(index, 1);
        }
        deletedElements = this.visibleParentDateObjects.filter(dateObj => dateObj['deleted']);
        for(let deletedElement of deletedElements)
        {
            let index = this.visibleParentDateObjects.indexOf(deletedElement);
            this.visibleParentDateObjects.splice(index, 1);
        }
    }
    
    dateId(dateObj)
    {
        return this.dateTrack(0, dateObj);
    }
    
    dateTrack(index, dateObj)
    {
        if(dateObj.titles.length === 3) return dateObj.short + ' ' + dateObj.titles[0] + ' ' + dateObj.titles[1] + ' ' + dateObj.titles[2] + ' ' + dateObj.type;
        if(dateObj.titles.length === 2) return dateObj.short + ' ' + dateObj.titles[0] + ' ' + dateObj.titles[1] + ' ' + dateObj.type;
        if(dateObj.titles.length === 1) return dateObj.short + ' ' + dateObj.titles[0] + ' ' + dateObj.type;
        
        return dateObj.short + ' ' + dateObj.titles.join(' ') + ' ' + dateObj.type;
    }
    
    defineCurrentlyVisibleNumbers()
    {
        let range = Math.round(this.end - this.start);
        //let precision = range / number_ticks;
        let zeros = range.toString().length - 1;
        let closestPowerOfTen = Math.pow(10, zeros);
        let sizeScalingFactor = this.vertical ? NumberVisComponent.NORMAL_SIZE / this.height : NumberVisComponent.NORMAL_SIZE / this.width;
        let ratio = range / closestPowerOfTen * sizeScalingFactor;

        if(ratio <= 1)
        {
            zeros -= 1;
            closestPowerOfTen = Math.pow(10, zeros);
        } else if(ratio < 1.5)
        {
            closestPowerOfTen === 10 ? closestPowerOfTen /= 5 : closestPowerOfTen /= 4;
        } else if(ratio < 4.2)
        {
            closestPowerOfTen /= 2;
        } else if(ratio < 6)
        {
            /*closestPowerOfTen *= 0.75;*/
        } else if(ratio > 20)
        {
            closestPowerOfTen *= 4;
        } else if(ratio > 10)
        {
            closestPowerOfTen *= 2;
        }
        if(closestPowerOfTen < 1) closestPowerOfTen = 1;
        //console.log(closestPowerOfTen, ratio, sizeScalingFactor);

        let start = Math.round(this.start / closestPowerOfTen) * closestPowerOfTen;
        let perEach = closestPowerOfTen;
        if(perEach < 1) perEach = 1;

        this.visibleNumbers = [];
        for(let visibleNumber = start; visibleNumber < this.fixedEnd && visibleNumber < this.end + 1; visibleNumber += perEach)
        {
            if(visibleNumber > this.fixedStart && visibleNumber > this.start - 1)
            {
                this.visibleNumbers.push(visibleNumber);
            }
        }

        this.updateVisibleNumberTimes();
        this.defineFillerNumbers();
        this.defineRectangleNumbers();
        this.animateRadii();
    }

    updateVisibleNumberTimes()
    {
        for(let number in this.visibleNumberTimes)
        {
            if(this.visibleNumbers.indexOf(parseInt(number)) == -1)
            {
                delete this.visibleNumberTimes[number];
            }
        }

        for(let number of this.visibleNumbers)
        {
            if(!this.visibleNumberTimes[number])
            {
                this.visibleNumberTimes[number] = Date.now();
            }
        }
    }

    visibleRadii = {};
    opacities = {};

    animateRadii()
    {
        let transitionTime = 600;
        let start = 4;
        let goal = 4;
        let opacityStart = 0;
        let opacityGoal = 1;

        let finishedNumbers = this.visibleNumbers.filter(number => Date.now() - this.visibleNumberTimes[number] >= transitionTime);
        for(let number of finishedNumbers)
        {
            this.visibleRadii[number] = goal;
            this.opacities[number] = opacityGoal;
        }

        let animate = () =>
        {
            let unfinishedNumbers = this.visibleNumbers.filter(number => Date.now() - this.visibleNumberTimes[number] < transitionTime);
            if(!unfinishedNumbers.length) return;

            for(let number of unfinishedNumbers)
            {
                let timePassed = Date.now() - this.visibleNumberTimes[number];
                if(timePassed > transitionTime) timePassed = transitionTime;
                this.visibleRadii[number] = start + (goal - start) * timePassed / transitionTime;
                this.opacities[number] = opacityStart + (opacityGoal - opacityStart) * timePassed / transitionTime;
            }

            window.requestAnimationFrame(animate);
        };

        animate();
    }

    rectNumbers = [];

    defineRectangleNumbers()
    {
        let sizeScalingFactor = this.vertical ? NumberVisComponent.NORMAL_SIZE / this.height : NumberVisComponent.NORMAL_SIZE / this.width;
        
        if((this.end - this.start) * sizeScalingFactor > 300)
        {
            return;
        }

        for(let i = Math.round(this.start); i < this.end + 1; i++)
        {
            this.rectNumbers.push(i);
        }
    }

    fillerNumbers = [];

    defineFillerNumbers()
    {
        this.fillerNumbers = [];
        let visibleStepSize = this.visibleNumbers[1] - this.visibleNumbers[0];
        if(visibleStepSize < 5) return;

        let stepSize = Math.round(visibleStepSize / 5);
        for(let fillerNumber = this.visibleNumbers[0] - visibleStepSize; fillerNumber < this.fixedEnd && fillerNumber < this.end; fillerNumber += stepSize)
        {
            if(fillerNumber > this.fixedStart && fillerNumber > this.start)
            {
                this.fillerNumbers.push(fillerNumber);
            }
        }
    }

    numbers = [];

    onTimelineReady()
    {
        this.defineCurrentlyVisible();
    }

}
