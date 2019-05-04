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
    selector: 'app-tables-component',
    templateUrl: 'tables.component.html',
    styleUrls: ['./tables.component.css']
})
export class TablesComponent
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
    distributionsByStudy;

    dists = [0, 10, 20, 40, 100, 1000, 100000, 5000000];
    distNames = this.dists.map(d => 'dist-' + d);
    distToID = {0: 'Initial Find', 10: 3.32, 20: 4.32, 40: 5.32, 100: 6.64, 1000: 9.96, 100000: 16.61, 5000000: 22.25, 20000000: 24.25 };
    
    constructor(private db: AngularFireDatabase, private comboService: ComboService, private http: Http)
    {
        db.object('/metadata').subscribe(metaData =>
        {
            this.metaDataById = metaData;
            this.metaDataIds = Object.keys(metaData);
    
            this.http.get('http://localhost:3000').subscribe((analyzedDataRes) =>
            //this.http.get('http://192.168.0.100:3000').subscribe((analyzedDataRes) =>
            {
                const analyzedData = analyzedDataRes.json();
                this.taskDurationsByParticipant = analyzedData.taskDurations;
                this.targetIndexes = analyzedData.targetIndexes;
                this.distributionsByStudy = analyzedData.distributionsByStudy;
                
                //console.log(this.targetIndexes);
                console.log(this.stateComparisons.computer);
                console.log(this.distributionsByStudy);
                
                this.getInitialZoomInByMethodDomSpeed();
                //this.getInteractionDifferences();
                this.getInteractionComparison();
                
                this.checkLearningEffect();
            });
        });
        
    }
    
    newComers = [];
    oldSchoolers = [];
    
    checkLearningEffect()
    {
        console.log(this.taskDurationsByParticipant);
        for(let studyKey in this.taskDurationsByParticipant)
        {
            if(studyKey.substr(0,5) === 'SZ03M')
            {
                let taskTimes = [];
                for(let run of ['realrun-1', 'realrun-2'])
                {
                    taskTimes.push(this.taskDurationsByParticipant[studyKey][this.mobileDefaultSetting][run]['dist-0']);
                }
                
                if(this.participatedInStudiesZeroToTwo(studyKey))
                {
                    this.oldSchoolers.push(taskTimes[0]);
                    this.oldSchoolers.push(taskTimes[1]);
                }
                else
                {
                    this.newComers.push(taskTimes[0]);
                    this.newComers.push(taskTimes[1]);
                }
            }
        }
        console.log(this.newComers);
        console.log(this.oldSchoolers);
    }
    
    getDistsArrays()
    {
        let data = {};
        this.distNames.forEach(distName => data[distName] = []);
        
        return data;
    }
    
    initialZoomInByMethodDomSpeed = [];
    mobileDefaultSetting = 'vertical-dates-normalpan-pinchzoom';
    computerDefaultSetting = 'vertical-dates-normalpan-wheelzoom';
    study2MobileSettings = ['vertical-dates-normalpan-holdzoomin-holdzoomout', 'vertical-dates-pinchpan-brushzoomin-dblclickzoomout'];
    study2ComputerSettings = ['vertical-dates-normalpan-holdzoomin-holdzoomout', 'vertical-dates-normalpan-dblclickzoomin-holdzoomout'];
    
    getInitialZoomInByMethodDomSpeed()
    {
        for(let studyKey in this.taskDurationsByParticipant)
        {
            const study = studyKey.substr(0, 5);
            const participantData = this.taskDurationsByParticipant[studyKey]
            
            //console.log(study);
            if(study === 'SZ03M' || study === 'SZ02M')
            {
                for(const run of ['realrun-1', 'realrun-2'])
                {
                    let data = {
                        'domAppendRemovePerMs': this.metaDataById[studyKey]['browserInfo']['domAppendRemovePerMs']
                    };
                    
                    for(const setting of this.interactionsMobile)
                    {
                        if(participantData.hasOwnProperty(setting) && (setting !== 'vertical-dates-normalpan-holdzoomin-holdzoomout' || study !== 'SZ03M'))
                        {
                            data[setting] = participantData[setting][run]['dist-1000'];
                        }
                        
                    }
                    
                    this.initialZoomInByMethodDomSpeed.push(data);
                }
                
                
            }
        }
        //console.log(this.initialZoomInByMethodDomSpeed);
    }
    
    interactionComparisonMobile;
    interactionComparisonComputer;
    interactionRunDiffMobile = {};
    interactionRunDiffDesktop = {};
    runsToUseForComparison = ['realrun-1', 'realrun-2'];
    comparisonSettingPrefix = 'vertical-dates-';
    interactionsMobile = ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'pinchpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(interaction => this.comparisonSettingPrefix + interaction);
    interactionsMobileWithoutDefault = this.interactionsMobile.filter(interaction => interaction !== this.mobileDefaultSetting);
    interactionsComputer = ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dynamiczoomxadjustable', 'wheelpan-brushzoomin-dblclickzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'].map(interaction => this.comparisonSettingPrefix + interaction);
    interactionsComputerWithoutDefault = this.interactionsComputer.filter(interaction => interaction !== this.computerDefaultSetting);
    comparisonDataFromStudy = {
        'SZ00P': [],
        'SZ00M': [],
        
        'SZ01P': ['normalpan-wheelzoom', 'wheelpan-brushzoomin-dblclickzoomout'],
        'SZ02P': ['normalpan-wheelzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout'],
        'SZ03P': ['normalpan-wheelzoom', 'normalpan-dynamiczoomxadjustable', 'normalpan-rubzoominx-rubzoomouty'],
    
        /*'SZ01M': ['normalpan-pinchzoom', 'normalpan-dynamiczoomxadjustable'],
        'SZ02M': ['normalpan-pinchzoom', 'pinchpan-brushzoomin-dblclickzoomout'],
        'SZ03M': ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'],*/
    
        'SZ01M': ['normalpan-dynamiczoomxadjustable'],
        'SZ02M': ['pinchpan-brushzoomin-dblclickzoomout'],
        'SZ03M': ['normalpan-pinchzoom', 'normalpan-holdzoomin-holdzoomout', 'normalpan-dblclickzoomin-holdzoomout', 'normalpan-rubzoominx-rubzoomouty'],
    };
    stateComparisons = {
        computer: [
            {study: 'SZ01P', setting: 'vertical-dates-wheelpan-brushzoomin-dblclickzoomout'},
            {study: 'SZ02P', setting: 'vertical-dates-normalpan-holdzoomin-holdzoomout'},
            {study: 'SZ02P', setting: 'vertical-dates-normalpan-dblclickzoomin-holdzoomout'},
            {study: 'SZ03P', setting: 'vertical-dates-normalpan-wheelzoom'},
            {study: 'SZ03P', setting: 'vertical-dates-normalpan-dynamiczoomxadjustable'},
            {study: 'SZ03P', setting: 'vertical-dates-normalpan-rubzoominx-rubzoomouty'}],
        mobile: [
            {study: 'SZ01M', setting: 'vertical-dates-normalpan-dynamiczoomxadjustable'},
            {study: 'SZ02M', setting: 'vertical-dates-pinchpan-brushzoomin-dblclickzoomout'},
            {study: 'SZ03M', setting: 'vertical-dates-normalpan-pinchzoom'},
            {study: 'SZ03M', setting: 'vertical-dates-normalpan-holdzoomin-holdzoomout'},
            {study: 'SZ03M', setting: 'vertical-dates-normalpan-dblclickzoomin-holdzoomout'},
            {study: 'SZ03M', setting: 'vertical-dates-normalpan-rubzoominx-rubzoomouty'}]
    };
    
    comparisonDataLoaded = false;
    
    getInteractionComparison()
    {
        this.interactionComparisonMobile = {};
        this.interactionComparisonComputer = {};
    
        this.interactionsMobile.forEach(setting =>
        {
            this.interactionComparisonMobile[setting] = this.getDistsArrays();
            this.interactionDifferencesMobile[setting] = this.getDistsArrays();
        });
    
        this.interactionsComputer.forEach(setting =>
        {
            this.interactionComparisonComputer[setting] = this.getDistsArrays();
            this.interactionDifferencesComputer[setting] = this.getDistsArrays();
        });
    
        for(let studyKey in this.taskDurationsByParticipant)
        {
            const study = studyKey.substr(0, 5);
            const participantData = this.taskDurationsByParticipant[studyKey];
            const platform = study.substr(4,1);
            const relevantData = platform === 'P' ? this.interactionComparisonComputer : this.interactionComparisonMobile;
            const relevantDiffData = platform === 'P' ? this.interactionDifferencesComputer : this.interactionDifferencesMobile;
            const relevantSettings = this.comparisonDataFromStudy[study];
            const relevantDefaultSetting = platform === 'P' ? this.computerDefaultSetting : this.mobileDefaultSetting;
            const relevantRunDiff = platform === 'P' ? this.interactionRunDiffDesktop : this.interactionRunDiffMobile;
            const participantTaskTimesByDist = this.getDistsArrays();
            
            for(const run of this.runsToUseForComparison)
            {
                for(const interaction of relevantSettings)
                {
                    const setting = this.comparisonSettingPrefix + interaction;
                    
                    if(participantData[setting])
                    {
                        for(let dist in participantData[setting][run])
                        {
                            if(participantData[setting][run].hasOwnProperty(dist))
                            {
                                const taskTime = participantData[setting][run][dist];
                                relevantData[setting][dist].push(taskTime);
                                
                                if((platform === 'P' && setting !== this.computerDefaultSetting) || (platform === 'M' && setting !== this.mobileDefaultSetting))
                                {
                                    relevantDiffData[setting][dist].push(taskTime - participantData[relevantDefaultSetting][run][dist]);
                                }
                                participantTaskTimesByDist[dist].push(taskTime);
                            }
                        }
                    }
                    else {
                        //console.log('nothing for ', setting, ' in ', participantData)
                    }
                }
            }
    
            for(const run of ['testrun-1', 'realrun-1', 'realrun-2'])
            {
                for(const interaction of relevantSettings)
                {
                    const setting = this.comparisonSettingPrefix + interaction;
            
                    if(participantData[setting])
                    {
                        for(let dist in participantData[setting][run])
                        {
                            if(participantData[setting][run].hasOwnProperty(dist))
                            {
                                const taskTime = participantData[setting][run][dist];
                                const distAvg = participantTaskTimesByDist[dist].reduce((a,b) => a+b) / participantTaskTimesByDist[dist].length;
                                const diff = taskTime - distAvg;
                                
                                const progressNumber = this.targetIndexes[studyKey][setting][run][dist];
                                
                                if(!relevantRunDiff[setting])
                                {
                                    relevantRunDiff[setting] = {};
                                }
                                if(!relevantRunDiff[setting][progressNumber])
                                {
                                    relevantRunDiff[setting][progressNumber] = [];
                                }
                                relevantRunDiff[setting][progressNumber].push(diff);
                            }
                        }
                    }
                    else {
                        console.log('nothing for ', setting, ' in ', participantData)
                    }
                }
            }
        }
        console.log(this.interactionRunDiffMobile);
        console.log(this.interactionRunDiffDesktop);
        /*console.log(this.interactionComparisonMobile);
        console.log(this.interactionComparisonComputer);*/
        
        this.comparisonDataLoaded = true;
        this.differencesLoaded = true;
        
        //console.log(this.interactionComparisonMobile)
    }
    
    participatedInStudiesZeroToTwo(metadataId)
    {
        const mturkId = this.metaDataById[metadataId].mturkId;
        
        const values = Object.keys(this.metaDataById).map(key => this.metaDataById[key]);
        
        for(let metadataKey in this.metaDataById)
        {
            if(metadataKey.substr(0,4) == 'SZ00' || metadataKey.substr(0,4) == 'SZ01' || metadataKey.substr(0,4) == 'SZ02')
            {
                if(this.metaDataById[metadataKey].mturkId == mturkId)
                {
                    return true;
                }
            }
        }
        return false;
    }
    
    interactionDifferencesMobile = {};
    interactionDifferencesComputer = {};
    differencesLoaded = false;
    
    getInteractionDifferences()
    {
        /*this.interactionDifferencesMobile = {
            'vertical-dates-normalpan-holdzoomin-holdzoomout': this.getDistsArrays(),
            'vertical-dates-pinchpan-brushzoomin-dblclickzoomout': this.getDistsArrays()
        };
        this.interactionDifferencesComputer = {
            'vertical-dates-normalpan-holdzoomin-holdzoomout': this.getDistsArrays(),
            'vertical-dates-normalpan-dblclickzoomin-holdzoomout': this.getDistsArrays()
        };*/
        
        for(let studyKey in this.taskDurationsByParticipant)
        {
            const study = studyKey.substr(0, 5);
            const participantData = this.taskDurationsByParticipant[studyKey];
            
            if(study === 'SZ02M')
            {
                for(const run of ['realrun-1', 'realrun-2'])
                {
                    for(const setting of this.study2MobileSettings)
                    {
                        if(setting !== this.mobileDefaultSetting)
                        {
                            for(let dist in participantData[setting][run])
                            {
                                let diff = participantData[setting][run][dist] - participantData[this.mobileDefaultSetting][run][dist];
                                this.interactionDifferencesMobile[setting][dist].push(diff);
                            }
                        }
                    }
                }
            }
            if(study === 'SZ02P')
            {
                for(const run of ['realrun-1', 'realrun-2'])
                {
                    for(const setting of this.study2ComputerSettings)
                    {
                        if(setting !== this.computerDefaultSetting)
                        {
                            for(let dist in participantData[setting][run])
                            {
                                let diff = participantData[setting][run][dist] - participantData[this.computerDefaultSetting][run][dist];
                                this.interactionDifferencesComputer[setting][dist].push(diff);
                            }
                        }
                    }
                }
            }
        }
        console.log(this.interactionDifferencesMobile);
        console.log(this.interactionDifferencesComputer);
        this.differencesLoaded = true;
    }
}
