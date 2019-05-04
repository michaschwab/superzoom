import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {ComboService} from '../../services/combo.service';
import {ActivatedRoute } from '@angular/router';
import {ExperimentsettingsService} from '../../services/experimentsettings.service';
import {BrowserinfoService} from '../../services/browserinfo.service';

@Component({
    selector: 'mturk-app',
    templateUrl: './mturk.component.html',
    styleUrls: ['./mturk.component.css']
})
export class MTurkComponent
{
    steps = {'WELCOME': 0, 'IRB': 100, 'INFO_SETS': 200, 'INFO_METHODS': 300 };
    study;
    studyBegun = false;
    stepKeys = Object.keys(this.steps);
    step = 0;
    mobile = false;
    settings = [];
    mobileSettings = [];
    desktopSettings = [];
    numberFinishedByStudyId = {};
    experimentSettings = {};
    currentNumbersByStudyPlatform = {};
    currentSettingsNumbers: {[platform: string]: {current: number, max: number}};
    currentStudyId = '';
    currentStudyRunId = '';
    otherPlatformStudyRunId = '';
    canContinue = true;
    metadata;
    
    DATE_SCALE = 60000;
    mobileRequested = false;
    browser: {name: string, version: string};
    isiPhone: boolean;
    isTablet: boolean;
    
    windowWidth = 0;
    windowHeight = 0;
    
    constructor(private route: ActivatedRoute, experimentsettingsService: ExperimentsettingsService, private db: AngularFireDatabase, browserinfo: BrowserinfoService)
    {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            this.mobile = true;
        }
        this.mobileRequested = this.route.snapshot.url[0].toString() === 'szm';
        const studyId = this.route.snapshot.paramMap.get('studyId');
        // wait for experimentsettings service to load the correct study
        experimentsettingsService.ready().then(() =>
        {
            this.study = experimentsettingsService.getStudy(studyId);
            this.settings = experimentsettingsService.getStudySettings(studyId);
            this.mobileSettings = this.settings.filter(c => c.mobile);
            this.desktopSettings = this.settings.filter(c => !c.mobile);
            this.currentStudyId = experimentsettingsService.getStudyShorthand();
            
            // this.otherPlatformStudyRunId = this.mobile ? this.currentStudyRunId
            
            this.db.object('settings').subscribe(experimentSettings =>
            {
                this.experimentSettings = experimentSettings;
                this.setCurrentNumbers();
            });
            this.db.list('metadata').subscribe(metadata =>
            {
                this.metadata = metadata;
                this.setCurrentNumbers();
            });
        });
    
        this.checkPortrait();
        this.isiPhone = browserinfo.isiPhone();
        this.isTablet = browserinfo.isTablet();
        this.browser = browserinfo.getBrowserNameVersion();
    }
    
    setCurrentNumbers()
    {
        if(this.experimentSettings && this.metadata)
        {
            this.currentNumbersByStudyPlatform = {};
            for(let key in this.experimentSettings)
            {
                this.currentNumbersByStudyPlatform[key] =
                    {
                        'mobile': {current: 0, max: this.experimentSettings[key]['max-participants-mobile']},
                        'pc': {current: 0, max: this.experimentSettings[key]['max-participants-pc']},
                    };
            }
    
            for (const log of this.metadata)
            {
                const studyIdWithPlatform = log.$key.split('-', 1)[0];
                const studyId = studyIdWithPlatform.substr(0, studyIdWithPlatform.length-1);
                const platform = studyIdWithPlatform.substr(-1) === 'M' ? 'mobile' : 'pc';
        
                this.currentNumbersByStudyPlatform[studyId][platform]['current']++;
            }
            this.currentSettingsNumbers = this.currentNumbersByStudyPlatform[this.currentStudyId];
            
            const platform = !this.mobile ? 'pc' : 'mobile';
            this.canContinue = true;
            
            if(this.currentSettingsNumbers[platform]['current'] >= this.currentSettingsNumbers[platform]['max'])
            {
                this.canContinue = false;
            }
        }
    }
    
    isCurrentStep(stepNumber): boolean
    {
        let stepKey = -1;
        
        for (let i = 0; i < this.stepKeys.length; i++)
        {
            const stepName = this.stepKeys[i];
            const stepValue = this.steps[stepName];
            
            if (stepValue === stepNumber)
            {
                stepKey = i;
            }
        }
        
        return this.step === stepKey;
    }
    
    
    @HostListener('window:resize', ['$event'])
    onResize(event)
    {
        this.checkPortrait();
    }
    
    checkPortrait()
    {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
    }
}
