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
    selector: 'app-logs-component',
    templateUrl: 'logs.component.html',
    styleUrls: ['./logs.component.css']
})
export class LogsComponent
{
    eventLogs: FirebaseObjectObservable<any>;
    dataById = {};
    metaDataById = {};
    metaDataIds: string[];
    activeExperimentId = '';
    activeSetting = '';
    activeRun = '';
    DATE_SCALE = 60000;
    
    showIndividualLog = false;
    currentLog = null;
    currentLogValues = null;
    currentLogRangeTimeline = null;
    
    showReplay = false;
    margin = {top: 15, right: 10, bottom: 30, left: 10};
    vertical = false;
    zoomModes = [];
    end = 20000000;
    numberMode = false;
    width = 0;
    height = 0;
    
    replayDists = [];
    replayIndex = -1;
    replayLogs = null;
    replayEventData = {};
    replayDist = 0;
    
    barScalingFactor = 10;
    distributionsByStudy:
        { [study: string]:
            { [setting: string]:
                { [dist: string]: RunData }
            }
        };
    

    currentDistributionStudy = '';
    currentDistributionSetting = '';
    currentStudySettings = [];
    dists = [0, 10, 20, 40, 100, 1000, 100000, 5000000];
    distNames = this.dists.map(d => 'dist-' + d);
    studies = ['SZ00M', 'SZ00P', 'SZ01M', 'SZ01P', 'SZ02M', 'SZ02P', 'SZ03M', 'SZ03P'];
    showLogsByStudy = {};
    
    
    constructor(private db: AngularFireDatabase, private comboService: ComboService, private http: Http)
    {
        /*this.http.get('http://localhost:3000').subscribe((analyzedDataRes) =>
        {
            const analyzedData = analyzedDataRes.json();
            this.taskDurationsByParticipant = analyzedData.taskDurations;
            this.distributionsByStudy = analyzedData.distributionsByStudy;
        });*/
        this.studies.forEach(study =>
        {
            this.showLogsByStudy[study] = false;
        });
        
        db.object('/metadata').subscribe(metaData =>
        {
            this.metaDataById = metaData;
            this.metaDataIds = Object.keys(metaData);
        });
    }
    
    selectStudy(study)
    {
        this.currentDistributionStudy = study;
        this.currentDistributionSetting = '';
        this.currentStudySettings = Object.keys(this.distributionsByStudy[study]);
    }
    
    getMetadataIdsByStudy(study: string): string[]
    {
        return !this.metaDataIds ? [] : this.metaDataIds.filter(id => id.substr(0,5) == study);
    }
    
    selectExperiment(experimentId: string)
    {
        this.stopReplay();
        this.showIndividualLog = false;
        this.currentLogValues = null;
        this.activeRun = '';
        this.activeExperimentId = experimentId;
        console.log(experimentId);
    
        this.db.object('/interactionlogs/' + experimentId).subscribe(interactionData =>
        {
            this.dataById[experimentId] = interactionData;
            console.log(interactionData);
        });
    }
    
    
    selectSetting(experimentId: string, setting: string)
    {
        this.stopReplay();
        this.showIndividualLog = false;
        this.currentLogValues = null;
        this.activeRun = '';
        this.activeExperimentId = experimentId;
    }
    
    selectRun(experimentId: string, setting: string, run: string)
    {
        this.stopReplay();
        this.showIndividualLog = true;
        this.currentLog = this.dataById[experimentId][setting][run];
        const keys = Object.keys(this.currentLog);
        const values = keys.map(k => this.currentLog[k]);
        this.currentLogValues = values.sort((a, b) => a.distance - b.distance);
        this.activeRun = run;
        this.activeExperimentId = experimentId;
        
        this.currentLogRangeTimeline = {};
        for (const dist of keys)
        {
            const data = this.currentLog[dist].scaleTimeline;
            this.currentLogRangeTimeline[dist] = 'M';
            if (data)
            {
                const positions = data.map(d =>
                {
                    return {
                        x: Math.round((d.time - this.currentLog[dist].startTime) / 1000 * this.barScalingFactor),
                        y: Math.round(Math.log(d.end - d.start) * 1.8) - 2
                    }
                });
                
                for (const pos of positions)
                {
                    this.currentLogRangeTimeline[dist] += pos.x + ' ' + pos.y + ' L';
                }
            }
            this.currentLogRangeTimeline[dist] = this.currentLogRangeTimeline[dist].substr(0, this.currentLogRangeTimeline[dist].length - 1);
            // this.currentLogRangeTimeline[dist] += 'Z';
        }
        // console.log(this.currentLogRangeTimeline);
    }
    
    totalSetTaskTime()
    {
        return this.currentLogValues.map(a => a.taskTime).reduce((a, b) => a + b);
    }
    
    replay()
    {
        const settings = this.activeSetting.split('-', 2);
        const meta = this.metaDataById[this.activeExperimentId];
        const vertical = settings[0] === 'vertical';
        const comboId = this.activeSetting.substr(settings[0].length + settings[1].length + 2);
        this.comboService.generateCombos(meta.browserInfo.mobile, vertical);
        
        this.vertical = vertical;
        this.zoomModes = this.comboService.getModeNamesByComboId(comboId);
        this.end = 20000000;
        this.numberMode = settings[1] === 'numbers';
        this.width = meta.width;
        this.height = meta.height;
        this.replayDists = [];
        this.showReplay = true;
        
        this.eventLogs = this.db.object('eventlogs/' + this.activeExperimentId + '/' + this.activeSetting + '/' + this.activeRun);
        this.eventLogs.subscribe(log =>
        {
            const dists = Object.keys(log);
            this.replayEventData = {};
            
            for (const dist of dists)
            {
                const thisDistLog = this.currentLog[dist];
                
                this.replayEventData[dist] = log[dist].filter(event =>
                {
                    return event.time >= thisDistLog.startTime;
                });
            }
            
            this.replayDists = dists.sort((a, b) =>
            {
                return log[a][0].time - log[b][0].time;
            });
            
            const rect = document.getElementsByClassName('show-replay-wrap')[0].getBoundingClientRect();
            
            for (const dist of this.replayDists)
            {
                const events = this.replayEventData[dist];
                
                for (const event of events)
                {
                    if (event.positions)
                    {
                        for (const pos of event.positions)
                        {
                            pos.x += rect.left;
                            pos.y += rect.top - 100;
                        }
                    }
                }
            }
        });
    }
    
    stopReplay()
    {
        this.showReplay = false;
        this.replayLogs = null;
    }
    
    playNextReplay()
    {
        this.replayIndex++;
        this.replayDist = this.replayDists[this.replayIndex];
        this.replayLogs = this.replayEventData[this.replayDist];
    }
    
    sqrt(x: number): number
    {
        return Math.sqrt(x);
    }
    
    pow(x: number, y: number): number
    {
        return Math.pow(x, y);
    }
    
    keys(obj)
    {
        return Object.keys(obj);
    }
}
