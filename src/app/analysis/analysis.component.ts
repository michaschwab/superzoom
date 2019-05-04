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
    selector: 'app-analysis-component',
    templateUrl: 'analysis.component.html',
    styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent
{
    logs: FirebaseListObservable<any[]>;
    interactionLogs = [];
    metadata: FirebaseObjectObservable<any[]>;
    eventLogs: FirebaseObjectObservable<any>;
    dataById = {};
    metaDataById = {};
    metaDataIds: string[];
    activeExperimentId = '';
    activeSetting = '';
    activeRun = '';
    DATE_SCALE = 60000;
    
    showLogs = false;
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
    
    barScalingFactor = 15;
    studies = ['SZ00M', 'SZ00P'];
    significantZoomInTime = 1000;
    distributionsByStudy:
        { [study: string]:
            { [setting: string]:
                { [dist: string]: RunData }
            }
        };
    
    showDatesVsNumbersAnalysis = false;
    datesVsNumbersData:
    {
        [platform: string]:
        {
            [dist: string]:
            {
                [datesOrNumbers: string]: RunData
            }
            
        }
    };
    
    showVerticalVsHorizontalAnalysis = true;
    verticalVsHorizontalData:
        {
            [platform: string]:
                {
                    [dist: string]:
                        {
                            [method: string]: RunData
                        }
                    
                }
        };
    
    interactionComparisonData:
        {
            [platform: string]:
                {
                    [dist: string]:
                        {
                            [method: string]: RunData
                        }
                    
                }
        };
    
    runComparisonData:
        {
            [platform: string]:
                {
                    [dist: string]:
                        {
                            [run: string]: RunData
                        }
                    
                }
        };
    
    taskDurationsByParticipant;
    taskDurationIndividualDifferences = {};
    individualPerformances: {
        'dist-0': number[],
        'dist-10': number[],
        'dist-20': number[],
        'dist-40': number[],
        'dist-100': number[],
        'dist-1000': number[],
        'dist-100000': number[],
        'dist-5000000': number[]
    }[] = [];
    currentDistributionStudy = '';
    currentDistributionSetting = '';
    currentStudySettings = [];
    dists = [0, 10, 20, 40, 100, 1000, 100000, 5000000];
    distNames = this.dists.map(d => 'dist-' + d);
    
    constructor(private db: AngularFireDatabase, private comboService: ComboService, private http: Http)
    {
        this.http.get('http://localhost:3000').subscribe((analyzedDataRes) =>
        {
            const analyzedData = analyzedDataRes.json();
            this.datesVsNumbersData = analyzedData.datesVsNumbersData;
            this.verticalVsHorizontalData = analyzedData.verticalVsHorizontalData;
            console.log(this.verticalVsHorizontalData);
            this.runComparisonData = analyzedData.runComparisonData;
            this.taskDurationsByParticipant = analyzedData.taskDurations;
            this.distributionsByStudy = analyzedData.distributionsByStudy;
            this.interactionComparisonData = analyzedData.interactionComparisonData;
            
            this.computeIndividualDifferences();
            this.computeIndividualPerformances();
            //console.log(this.verticalVsHorizontalData);
        });
        
        db.object('/metadata').subscribe(metaData =>
        {
            this.metaDataById = metaData;
            this.metaDataIds = Object.keys(metaData);
        });
        
    }
    
    getAverageTaskDuration(study, setting, dist) : number
    {
        const data = this.distributionsByStudy[study][setting][dist].taskTimes;
        return data.reduce((a,b) => a+b) / data.length;
    }
    
    computeIndividualPerformances()
    {
        for(let studyKey in this.taskDurationsByParticipant)
        {
            const platform = studyKey.substr(4, 1);
            const study = studyKey.substr(0, 5);
            const participantData = this.taskDurationsByParticipant[studyKey];
            let participantDifference = {
                'dist-0': [],
                'dist-10': [],
                'dist-20': [],
                'dist-40': [],
                'dist-100': [],
                'dist-1000': [],
                'dist-100000': [],
                'dist-5000000': []
            };
            
    
            if (study == 'SZ01P')
            {
                this.individualPerformances.push(participantDifference);
                
                for(let setting in participantData)
                {
                    const settingData = participantData[setting];
                    // console.log(setting, settingData);
                    
                    for(let run in settingData)
                    {
                        const runData = settingData[run];
                        // console.log(runData);
    
                        for(let dist in runData)
                        {
                            const diffFromAvg = this.getAverageTaskDuration(study, setting, dist) - runData[dist];
    
                            participantDifference[dist].push(diffFromAvg);
                            // console.log(dist, diffFromAvg);
                        }
                    }
                }
            }
        }
        
        // console.log(this.individualPerformances);
    }
    
    computeIndividualDifferences()
    {
        for(let studyKey in this.taskDurationsByParticipant)
        {
            const platform = studyKey.substr(4,1);
            const study = studyKey.substr(0, 5);
            const participantData = this.taskDurationsByParticipant[studyKey];
            
            if(study == 'SZ01P')
            {
                for(let setting in participantData)
                {
                    const settingData = participantData[setting];
                    if(!this.taskDurationIndividualDifferences[setting])
                    {
                        this.taskDurationIndividualDifferences[setting] = {};
                        [0, 10, 20, 40, 100, 1000, 100000, 5000000].forEach(dist =>
                        {
                            this.taskDurationIndividualDifferences[setting]['dist-' + dist] = [];
                        })
                    }
                    
                    //console.log(settingData['realrun-1']);

                    for(let dist in settingData['realrun-1'])
                    {
                        this.taskDurationIndividualDifferences[setting][dist].push(settingData['realrun-1'][dist] - settingData['realrun-2'][dist]);
                    }
                }
            }
        }
        // console.log(this.taskDurationIndividualDifferences);
    }
    
    sqrt(x: number): number
    {
        return Math.sqrt(x);
    }
    
    pow(x: number, y: number): number
    {
        return Math.pow(x, y);
    }
}
