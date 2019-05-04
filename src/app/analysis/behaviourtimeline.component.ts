import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {AngularFireDatabase, FirebaseListObservable, FirebaseObjectObservable} from 'angularfire2/database';
import {ComboService} from '../../services/combo.service';
import {Http} from '@angular/http';
import {RunData} from './runData';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/delayWhen';
import 'rxjs/add/observable/from';

@Component({
    selector: 'app-behaviourtimeline-component',
    templateUrl: 'behaviourtimeline.component.html',
    styleUrls: ['./behaviourtimeline.component.css']
})
export class BehaviourtimelineComponent
{
    logs: FirebaseListObservable<any[]>;
    interactionLogs = [];
    metadata: FirebaseObjectObservable<any[]>;
    eventLogs: FirebaseObjectObservable<any>;
    dataById = {};
    metaDataById = {};
    metaDataIds: string[];
    taskDurationsByParticipant;
    targetIndexes;
    scaleTimelines;
    statusTimelines;
    
    dists = [0, 10, 20, 40, 100, 1000, 100000, 5000000];
    distNames = this.dists.map(d => 'dist-' + d);
    
    constructor(private db: AngularFireDatabase, private comboService: ComboService, private http: Http)
    {
        db.object('/metadata').subscribe(metaData => {
            this.metaDataById = metaData;
            this.metaDataIds = Object.keys(metaData);
            
            //this.http.get('http://192.168.0.100:3000/timelines-study1').subscribe((analyzedDataRes) =>
            this.http.get('http://localhost:3000/timelines').subscribe((analyzedDataRes) => {
                const analyzedData = analyzedDataRes.json();
                this.taskDurationsByParticipant = analyzedData.taskDurations;
                this.scaleTimelines = analyzedData.scaleTimelines;
                //this.targetIndexes = analyzedData.targetIndexes;
                this.statusTimelines = analyzedData.statusTimelines;
                console.log(this.statusTimelines);
                console.log('up');
                
                //this.prepareTimelines();
                this.ready = true;
            });
        });
        
    }
    
    ready = false;
    
    timelineDataBySettingDistStudy = {};
    mobileDefaultSetting = 'vertical-dates-normalpan-pinchzoom';
    computerDefaultSetting = 'vertical-dates-normalpan-wheelzoom';
    comparisonSettingPrefix = 'vertical-dates-';
    computerSettings = ['normalpan-wheelzoom'].map(s => this.comparisonSettingPrefix + s);
    //computerSettings = ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(s => this.comparisonSettingPrefix + s);
    //computerSettings = ['wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(s => this.comparisonSettingPrefix + s);
    
    sortStatii = false
    
    currentRun = 'realrun-1';
    currentSetting = 'normalpan-rubzoominx-rubzoomouty';
    currentStudy = 'SZ03M';
    
    prepareTimelines()
    {
        //console.log('what is going on');
        this.timelineDataBySettingDistStudy = {};
        const settings = [this.comparisonSettingPrefix + this.currentSetting];
        
        for (const setting of settings) {
            for (const run of [this.currentRun]) {
                
                for (const studyKey in this.statusTimelines) {
                    const study = studyKey.substr(0, 5);
                    if ((study === this.currentStudy) && this.statusTimelines[studyKey][setting]) {
                        for (const dist of this.distNames) {
                        //for (const dist of ['dist-1000']) {
                            if (this.scaleTimelines[studyKey][setting][run][dist]) {
                                if (!this.timelineDataBySettingDistStudy[setting]) {
                                    this.timelineDataBySettingDistStudy[setting] = {};
                                }
                                if (!this.timelineDataBySettingDistStudy[setting][dist]) {
                                    this.timelineDataBySettingDistStudy[setting][dist] = [];
                                }
                                /*if(!this.timelineDataBySettingDistStudy[setting][dist][study])
                                {
                                    this.timelineDataBySettingDistStudy[setting][dist][study] = [];
                                }*/
                                
                                const scaleTimeline = this.getScaleTimeline(this.scaleTimelines[studyKey][setting][run][dist]);
                                
                                let statusTimeline = this.getStatusTimeline(this.statusTimelines[studyKey][setting][run][dist]);
                                if (setting == 'vertical-dates-pinchpan-brushzoomin-dblclickzoomout') {
                                    this.fixPanBeingZoomOut(this.scaleTimelines[studyKey][setting][run][dist], statusTimeline);
                                }
                                if (setting == 'vertical-dates-normalpan-rubzoominx-rubzoomouty') {
                                    this.fixZoomOutBeingZoomIn(this.scaleTimelines[studyKey][setting][run][dist], statusTimeline);
                                }
                                
                                if(this.sortStatii)
                                    statusTimeline = this.sortStatusTimeline(statusTimeline);
                                
                                this.timelineDataBySettingDistStudy[setting][dist].push({
                                    scaleTimeline: scaleTimeline,
                                    statusTimeline: statusTimeline,
                                    studyKey: studyKey,
                                    taskTime: this.taskDurationsByParticipant[studyKey][setting][run][dist],
                                    startTime: scaleTimeline[0].time
                                });
                            }
                        }
                        
                    }
                }
                for (const dist of this.distNames) {
                    if (this.timelineDataBySettingDistStudy[setting])
                        this.timelineDataBySettingDistStudy[setting][dist].sort((a, b) => {
                            return this.taskDurationsByParticipant[a.studyKey][setting][run][dist] - this.taskDurationsByParticipant[b.studyKey][setting][run][dist];
                        });
                }
            }
            
        }
        //const dist = 'dist-0';
        //console.log('done parsing');
        //console.log(this.timelineDataBySettingDistStudy);
        
    }
    
    hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    timeScale = 1 / 1000 * 20;
    stateOrder = ['IDLE', 'PAN', 'ZOOM_IN', 'ZOOM_OUT'];
    
    fixZoomOutBeingZoomIn(scaleTimeline, statusTimeline)
    {
        let scales = Object.keys(scaleTimeline).map(key => scaleTimeline[key]);
        let stati = Object.keys(statusTimeline).map(key => statusTimeline[key]);
    
        /*const statusIndexByTime = {};
        for(let i = 0; i < stati.length; i++)
        {
            statusIndexByTime[stati[i].start] = i;
        }
        const statusStartTimes = Object.keys(statusIndexByTime).map(key => parseInt(key));
        
        for(let i = 1; i < scales.length; i++)
        {
            let prevRange = scales[i-1].end - scales[i-1].start;
            let newRange = scales[i].end - scales[i].start;
            if(newRange < prevRange)
            {
                // is zoom in
                const statusTime = this.getClosestSmallerNumber(statusStartTimes, scales[i].time);
                const index = statusIndexByTime[statusTime];
                if(index && stati[index] && stati[index].state !== 'ZOOM_IN')
                {
                    stati[index].state = 'ZOOM_IN';
                    //console.log('switched a status to zoom in')
                }
                
                //status.state
            }
        }*/
        
        const scaleIndexByTime = {};
        for(let i = 0; i < scales.length; i++)
        {
            const scalePoint = scales[i];
            scaleIndexByTime[scalePoint.time] = i;
        }
        const scaleTimes = Object.keys(scaleIndexByTime).map(key => parseInt(key));
        //console.log(scaleIndexByTime);
        //console.log(scaleTimes);
    
        statusTimeline.forEach(status =>
        {
            if(status.state == 'ZOOM_OUT')
            {
                // --- ignore below -----
                //const statusTimes = this.getNumbersWithin(scaleTimes, status.start, status.end);
                
                // now, figure out if it is overwhelmingly zoom in or zoom out.
    
                // check if there is a corresponding scale event, and one before.
                //const closestTime = this.getClosestNumber(scaleTimes, status.start);
                //console.log(Math.abs(status.start - closestTime), closestTime);
    
                // --- ignore above ----
                
                
                
                let beginningTime = this.getClosestNumber(scaleTimes, status.start);
                let endTime = this.getClosestNumber(scaleTimes, status.end);
                
                
                if(Math.abs(status.start - beginningTime) < 50 && Math.abs(status.end - endTime) < 50)
                {
                    const index = scaleIndexByTime[beginningTime];
                    const indexEnd = scaleIndexByTime[endTime];
                    //console.log(index);
                    if(index && indexEnd)
                    {
                        let beginningScalePoint = scales[index];
                        let lastScalePoint = scales[indexEnd];
                        let prevRange = beginningScalePoint.end - beginningScalePoint.start;
                        let newRange = lastScalePoint.end - lastScalePoint.start;
        
                        if(prevRange > newRange)
                        {
                            status.state = 'ZOOM_IN';
                            //console.log('changed a zoom out to a zoom in.');
                        }
                        else
                        {
                            //console.log('no')
                        }
                    }
                    else {
                        //console.log('couldnt find a matching scale status')
                    }
                }
                
            }
        });
    }
    
    getNumbersWithin(numbers: number[], min: number, max: number): number[]
    {
        return numbers.filter(n => n >= min && n <= max);
    }
    
    getClosestSmallerNumber(numbers: number[], number): number
    {
        let minDiff = 100000;
        let bestNumber = -1;
        for(let currNumber of numbers)
        {
            if(currNumber < number)
            {
                if(number - currNumber < minDiff)
                {
                    bestNumber = currNumber;
                    minDiff = number - currNumber;
                }
            }
            
        }
        return bestNumber;
    }
    
    getClosestNumber(numbers: number[], number): number
    {
        let minDiff = 100000;
        let bestNumber = -1;
        for(let currNumber of numbers)
        {
            const diff = Math.abs(number - currNumber);
            if(diff < minDiff)
            {
                bestNumber = currNumber;
                minDiff = diff;
            }
        }
        return bestNumber;
    }
    
    fixPanBeingZoomOut(scaleTimeline, statusTimeline)
    {
        scaleTimeline = Object.keys(scaleTimeline).map(key => scaleTimeline[key]);
        const scaleIndexByTime = {};
        for(let i = 0; i < scaleTimeline.length; i++)
        {
            const scalePoint = scaleTimeline[i];
            scaleIndexByTime[scalePoint.time] = i;
        }
        //console.log(scaleIndexByTime);
        
        statusTimeline.forEach(status =>
        {
            if(status.state == 'ZOOM_OUT')
            {
                // check if there is a corresponding scale event, and one before.
                const index = scaleIndexByTime[status.start];
                if(index && index !== 0)
                {
                    let currentScalePoint = scaleTimeline[index];
                    let lastScalePoint = scaleTimeline[index - 1];
                    let currentRange = currentScalePoint.end - currentScalePoint.start;
                    let previousRange = lastScalePoint.end - lastScalePoint.start;
                    
                    if(Math.abs(previousRange - currentRange) < 0.3)
                    {
                        status.state = 'PAN';
                        //console.log('changed a zoom out to a pan.');
                    }
                }
                else {
                    //console.log('couldnt find a matching scale status')
                }
            }
        });
    }
    
    getStatusTimeline(data)
    {
        //return Object.keys(data).map(key => data[key]);
        
        return Object.keys(data).map(key => data[key]);
    }
    
    sortStatusTimeline(timeline)
    {
        return timeline.sort((a,b)=>
        {
            return this.stateOrder.indexOf(a.state) - this.stateOrder.indexOf(b.state);
        });
    }
    
    getScaleTimeline(data)
    {
        const startTime = data[0].time;
        data = Object.keys(data).map(key => data[key]).sort((a,b) => a.start - b.start);
        data.forEach((val, i) =>
        {
            if(i !== 0)
            {
                val['duration'] = val.time - data[i-1].time;
            }
        });
        
        
        return data.map(d =>
        {
            const range = d.end - d.start;
            const rangeLog = Math.log(range);
            const oneDigitRange = this.hex[Math.round(rangeLog * 0.9)];
            const otherColor = oneDigitRange + oneDigitRange;
            const width = d.duration * this.timeScale;
            //console.log((d.time - startTime) * this.timeScale - width);
            //console.log(oneDigitRange);
            //console.log(Math.round(d.duration / 10));
            return {
                width: width,
                left: (d.time - startTime) * this.timeScale - width,
                color: '#ff' + otherColor + otherColor
            };
        });
        /*const positions = data.map(d =>
        {
            return {
                x: Math.round((d.time - this.currentLog[dist].startTime) / 1000 * this.barScalingFactor),
                y: Math.round(Math.log(d.end - d.start) * 1.8) - 2
            }
        });
    
        for (const pos of positions)
        {
            this.currentLogRangeTimeline[dist] += pos.x + ' ' + pos.y + ' L';
        }*/
    }
}
