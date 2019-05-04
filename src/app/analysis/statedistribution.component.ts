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
    selector: 'app-statedistribution-component',
    templateUrl: 'statedistribution.component.html',
    styleUrls: ['./statedistribution.component.css']
})
export class StatedistributionComponent
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
            //this.http.get('http://192.168.0.100:3000/timelines').subscribe((analyzedDataRes) => {
            //this.http.get('http://localhost:3000/timelines').subscribe((analyzedDataRes) => {
            this.http.get('http://localhost:3000/timelines-study1').subscribe((analyzedDataRes) => {
                const analyzedData = analyzedDataRes.json();
                this.taskDurationsByParticipant = analyzedData.taskDurations;
                this.scaleTimelines = analyzedData.scaleTimelines;
                //this.targetIndexes = analyzedData.targetIndexes;
                this.statusTimelines = analyzedData.statusTimelines;
                console.log(this.statusTimelines);
                console.log('up');
                
                this.prepareDistributions();
                this.ready = true;
            });
        });
        
    }
    
    ready = false;
    
    timelineDataBySettingDistStudy = {};
    mobileDefaultSetting = 'vertical-dates-normalpan-pinchzoom';
    computerDefaultSetting = 'vertical-dates-normalpan-wheelzoom';
    comparisonSettingPrefix = 'vertical-dates-';
    runs = ['realrun-1', 'realrun-2'];
    //runs = ['realrun-2'];
    computerSettings = ['normalpan-wheelzoom'].map(s => this.comparisonSettingPrefix + s);
    //computerSettings = ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(s => this.comparisonSettingPrefix + s);
    //computerSettings = ['wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(s => this.comparisonSettingPrefix + s);
    
    comparisonDataFromStudy = {
        'SZ00P': [],
        'SZ00M': [],
        
        'SZ01P': ['normalpan-wheelzoom', 'wheelpan-brushzoomin-dblclickzoomout'],
        'SZ02P': ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout'],
        'SZ03P': ['normalpan-wheelzoom', 'normalpan-dynamiczoomxadjustable', 'normalpan-rubzoominx-rubzoomouty'],
        
        /*'SZ01M': ['normalpan-pinchzoom', 'normalpan-dynamiczoomxadjustable'],
        'SZ02M': ['normalpan-pinchzoom', 'pinchpan-brushzoomin-dblclickzoomout'],
        'SZ03M': ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'],*/
        
        'SZ01M': ['normalpan-pinchzoom', 'normalpan-dynamiczoomxadjustable'],
        'SZ02M': ['pinchpan-brushzoomin-dblclickzoomout'],
        'SZ03M': ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'],
    };
    interactionComparisonMobile;
    interactionComparisonComputer;
    distToID = {0: 'Initial Find', 10: 3.32, 20: 4.32, 40: 5.32, 100: 6.64, 1000: 9.96, 100000: 16.61, 5000000: 22.25, 20000000: 24.25 };
    interactionsMobile = ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'pinchpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(interaction => this.comparisonSettingPrefix + interaction);
    interactionsMobileWithoutDefault = this.interactionsMobile.filter(interaction => interaction !== this.mobileDefaultSetting);
    interactionsComputer = ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(interaction => this.comparisonSettingPrefix + interaction);
    interactionsComputerWithoutDefault = this.interactionsComputer.filter(interaction => interaction !== this.computerDefaultSetting);
    
    prepareDistributions()
    {
    
        this.interactionComparisonMobile = {};
        this.interactionComparisonComputer = {};
    
        this.interactionsMobile.forEach(setting =>
        {
            this.interactionComparisonMobile[setting] = this.getDistsArrays();
        });
    
        this.interactionsComputer.forEach(setting =>
        {
            this.interactionComparisonComputer[setting] = this.getDistsArrays();
        });
    
        for(let studyKey in this.statusTimelines)
        {
            const study = studyKey.substr(0, 5);
            const participantData = this.statusTimelines[studyKey];
            const platform = study.substr(4,1);
            const relevantData = platform === 'P' ? this.interactionComparisonComputer : this.interactionComparisonMobile;
            const relevantSettings = this.comparisonDataFromStudy[study];
            const relevantDefaultSetting = platform === 'P' ? this.computerDefaultSetting : this.mobileDefaultSetting;
        
            for(const run of this.runs)
            {
                for(const interaction of relevantSettings)
                {
                    const setting = this.comparisonSettingPrefix + interaction;
                
                    if(participantData[setting])
                    {
                        for(let dist in participantData[setting][run])
                        {
                            if(participantData[setting][run].hasOwnProperty(dist) && this.statusTimelines[studyKey][setting][run][dist])
                            {
                                /*const taskTime = participantData[setting][run][dist];
                                relevantData[setting][dist].push(taskTime);*/
    
                                //const scaleTimeline = this.getScaleTimeline(this.scaleTimelines[studyKey][setting][run][dist]);
    
                                
                                let statusTimeline = this.getStatusTimeline(this.statusTimelines[studyKey][setting][run][dist]);
                                statusTimeline = statusTimeline.filter(s => s.duration > 0);
                                if (setting == 'vertical-dates-pinchpan-brushzoomin-dblclickzoomout') {
                                    this.fixPanBeingZoomOut(this.scaleTimelines[studyKey][setting][run][dist], statusTimeline);
                                }
                                if (setting == 'normalpan-rubzoominx-rubzoomouty') {
                                    this.fixZoomOutBeingZoomIn(this.scaleTimelines[studyKey][setting][run][dist], statusTimeline);
                                }
                                
                                //console.log(statusTimeline);
                                const zoomOutTime = statusTimeline.filter(s => s.state === 'ZOOM_OUT').map(a => a.duration).filter(d => d > 0).reduce((a,b) => a+b, 0);
                                const zoomInTime = statusTimeline.filter(s => s.state === 'ZOOM_IN').map(a => a.duration).filter(d => d > 0).reduce((a,b) => a+b, 0);
                                const idleTime = statusTimeline.filter(s => s.state === 'IDLE').map(a => a.duration).filter(d => d > 0).reduce((a,b) => a+b, 0);
                                const panTime = statusTimeline.filter(s => s.state === 'PAN').map(a => a.duration).filter(d => d > 0).reduce((a,b) => a+b, 0);
    
                                if(!relevantData[setting][dist] || !relevantData[setting][dist].zoomOutTimes)
                                {
                                    relevantData[setting][dist] = {
                                        zoomOutTimes: [],
                                        zoomInTimes: [],
                                        idleTimes: [],
                                        panTimes: [],
                                        taskTimes: []
                                    }
                                }
                                const taskTimeFromStates = zoomOutTime + zoomInTime + idleTime + panTime;
                                relevantData[setting][dist].zoomOutTimes.push(zoomOutTime);
                                relevantData[setting][dist].zoomInTimes.push(zoomInTime);
                                relevantData[setting][dist].idleTimes.push(idleTime);
                                relevantData[setting][dist].panTimes.push(panTime);
                                relevantData[setting][dist].taskTimes.push(taskTimeFromStates);
    
                                const taskTime = this.taskDurationsByParticipant[studyKey][setting][run][dist];
                                if(Math.abs(taskTime - taskTimeFromStates) > 100)
                                {
                                    console.log(studyKey, run, setting, dist, taskTime - taskTimeFromStates, taskTime, taskTimeFromStates);
                                }
                                
                                /*
  
                                this.timelineDataBySettingDistStudy[setting][dist].push({
                                    scaleTimeline: scaleTimeline,
                                    statusTimeline: statusTimeline,
                                    studyKey: studyKey,
                                    taskTime: this.taskDurationsByParticipant[studyKey][setting][run][dist],
                                    startTime: scaleTimeline[0].time
                                });*/
                            }
                        }
                    }
                    else {
                        //console.log('nothing for ', setting, ' in ', participantData)
                    }
                }
            }
        
        }
        
        for(let data of [this.interactionComparisonMobile])
        {
            for(let setting in data)
            {
                if(data.hasOwnProperty(setting))
                {
                    for(let dist in data[setting])
                    {
                        if(data[setting].hasOwnProperty(dist))
                        {
                            const taskTimes = data[setting][dist].taskTimes;
                            if(taskTimes)
                            {
                                const avg = taskTimes.reduce((a,b) => a+b) / taskTimes.length;
    
                                for(let i = taskTimes.length - 1; i >= 0; i--)
                                {
                                    if(taskTimes[i] > avg * 1.5)
                                    {
                                        console.log('filtering ', taskTimes[i], avg, setting, dist);
                                        data[setting][dist].taskTimes.splice(i, 1);
                                        data[setting][dist].zoomInTimes.splice(i, 1);
                                        data[setting][dist].zoomOutTimes.splice(i, 1);
                                        data[setting][dist].panTimes.splice(i, 1);
                                        data[setting][dist].idleTimes.splice(i, 1);
            
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        /*for (const setting of settings) {
            for (const run of this.runs) {
                
                for (const studyKey in this.statusTimelines) {
                    const study = studyKey.substr(0, 5);
                    if (this.statusTimelines[studyKey][setting]) {
                        for (const dist of this.distNames) {
                            //for (const dist of ['dist-1000']) {
                            if (this.scaleTimelines[studyKey][setting][run][dist]) {
                                if (!this.timelineDataBySettingDistStudy[setting]) {
                                    this.timelineDataBySettingDistStudy[setting] = {};
                                }
                                if (!this.timelineDataBySettingDistStudy[setting][dist]) {
                                    this.timelineDataBySettingDistStudy[setting][dist] = [];
                                }
                                /!*if(!this.timelineDataBySettingDistStudy[setting][dist][study])
                                {
                                    this.timelineDataBySettingDistStudy[setting][dist][study] = [];
                                }*!/
                                
                                
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
            
        }*/
        //const dist = 'dist-0';
        //console.log('done parsing');
        console.log(this.timelineDataBySettingDistStudy);
        
    }
    
    hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
    timeScale = 1 / 1000 * 20;
    stateOrder = ['IDLE', 'PAN', 'ZOOM_IN', 'ZOOM_OUT'];
    
    fixZoomOutBeingZoomIn(scaleTimeline, statusTimeline)
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
                    
                    if(currentRange < previousRange)
                    {
                        status.state = 'ZOOM_IN';
                        console.log('changed a zoom out to a zoom in.');
                    }
                }
                else {
                    //console.log('couldnt find a matching scale status')
                }
            }
        });
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
        return Object.keys(data).map(key => data[key]);
        
        /*return Object.keys(data).map(key => data[key]).sort((a,b)=>
        {
            return this.stateOrder.indexOf(a.state) - this.stateOrder.indexOf(b.state);
        });*/
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
    
    
    getDistsArrays()
    {
        let data = {};
        this.distNames.forEach(distName => data[distName] = []);
        
        return data;
    }
    
}
