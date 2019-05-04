import {AfterViewInit, Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';
import {ComboService} from '../../services/combo.service';
import {ActivatedRoute } from '@angular/router';
import {RandomstringService} from '../../services/randomstring.service';
import {ExperimentsettingsService} from '../../services/experimentsettings.service';
import {BrowserinfoService} from '../../services/browserinfo.service';

@Component({
    selector: 'study-app',
    templateUrl: './study.component.html',
    styleUrls: ['./study.component.css']
})
export class StudyComponent implements AfterViewInit
{
    public static MODES = {'HOLD_ZOOM_IN': 0, 'HOLD_ZOOM_OUT': 1, 'CLICK_HOLD_ZOOM_IN': 2, 'CLICK_HOLD_ZOOM_OUT': 3, 'SIMPLE_PAN': 4, 'DBLCLICK_ZOOM_IN': 5, 'DBLCLICK_ZOOM_OUT': 6, 'DBLRIGHTCLICK_ZOOM_IN': 7, 'DBLRIGHTCLICK_ZOOM_OUT': 8, 'WHEEL_ZOOM': 9, 'WHEEL_PAN_X': 10, 'WHEEL_PAN_Y': 11, 'BRUSH_ZOOM_X': 12, 'BRUSH_ZOOM_Y': 13, 'BRUSH_ZOOM_2D': 14, 'DYNAMIC_ZOOM_X_STATIC': 15, 'DYNAMIC_ZOOM_X_ORIGINAL_PAN': 16, 'DYNAMIC_ZOOM_X_NORMAL_PAN': 17, 'DYNAMIC_ZOOM_X_ADJUSTABLE': 18, 'DYNAMIC_ZOOM_Y_STATIC': 19, 'DYNAMIC_ZOOM_Y_ORIGINAL_PAN': 20, 'DYNAMIC_ZOOM_Y_NORMAL_PAN': 21, 'DYNAMIC_ZOOM_Y_ADJUSTABLE': 22, 'PINCH_ZOOM': 23, 'PINCH_ZOOM_QUADRATIC': 24, 'PINCH_ZOOM_POWER_FOUR': 25, 'FLICK_PAN': 26, 'RUB_ZOOM_IN_X': 27, 'RUB_ZOOM_IN_Y': 28, 'RUB_ZOOM_OUT_X': 29, 'RUB_ZOOM_OUT_Y': 30, 'PINCH_PAN': 31, 'WHEEL_ZOOM_MOMENTUM': 32, 'PINCH_ZOOM_MOMENTUM': 33 };
    public static STATES = {'IDLE': 0, 'ZOOM_IN': 1, 'ZOOM_OUT': 2, 'PAN': 3};
    public static STATE_NAMES = Object.keys(StudyComponent.STATES);
    public static TARGET_DISTANCES_REAL = [0, 10, 20, 40, 100, 1000, 100000, 5000000];
    public static TARGET_DISTANCES_TEST = [0, 10, 40, 100000];
    public static TARGET_DISTANCES_REAL_ODD = [0, 10, 21, 39, 98, 997, 98972, 4987901];
    public static TARGET_DISTANCES_TEST_ODD = [0, 10, 39, 98972];
    
    public NUMBER_TEST_RUNS = 1;
    public NUMBER_MAIN_RUNS = 2;
    public NUMBER_RUNS_PER_SETTING = this.NUMBER_TEST_RUNS + this.NUMBER_MAIN_RUNS;
    
    @ViewChild('container') container: ElementRef;
    
    public allZoomModes = Object.keys(StudyComponent.MODES);
    private db: AngularFireDatabase;
    private randomstringService: RandomstringService;
    private comboService: ComboService;
    private experimentsettingsService: ExperimentsettingsService;
    
    loadVis = false;
    showVis = false;
    mobile = false;
    platform = 'PC';
    
    // targetDistances = [0, 10, 20, 40, 100, 1000, 10000, 100000, 1000000, 5000000];
    targetDistances : number[];
    //targetDistances = [0, 10];
    targets = [6805268, 9623603, 6716131, 13392147, 10254594, 9111121, 13070089, 10664001, 12301787, 11946879, 10813107, 11907259, 9803156, 8507108, 9681304, 13466524, 6690863, 13756731, 8852402, 1292826, 10866234, 6678843, 8763796, 8761973, 8714948, 7333474, 10234252, 7652541, 6849033, 6994671, 12637426, 12876446, 11261148, 10269067, 9134541, 9028832, 9539247];
    currentMainTarget: number;
    currentTarget = null;
    currentTargets = [];
    currentTargetDistance = 0;
    finishedTargets = [];
    finishedTotalTargetsCount = 0;
    finishedDistances = [];
    DATE_SCALE = 60000;
    clickedTargets = [];
    
    defaultStart = 0;
    defaultEnd = 20000000;
    start = this.defaultStart;
    end = this.defaultEnd;
    numberMode = false;
    //margin = {top: 30, right: 30, bottom: 60, left: 30};
    margin = {top: 15, right: 10, bottom: 30, left: 10};
    vertical = true;
    zoomModes = [];
    height = 0;
    width = 0;
    
    waiting = false;
    interactionDisabled = false;
    currentRunPerBranch = 0;
    currentRunTotal = 0;
    progress = 0;
    hasNextTarget = false;
    hasNextRun = false;
    hasNextSetting = false;
    hasAllTasksFinished = false;
    hasCompletelyFinished = false;
    readyForTasks = false;
    test_ran = false;
    test_running = false;
    formdata = { feedback: '', gender: '', age: -2, 'pc-use': -2, 'mobile-use': -2};
    showCode = false;
    showForm = true;
    
    selectedTarget = 0;
    currentTaskStart: number;
    
    comboSelection = false;
    combinations = [];
    combo = null;
    combinationIndex = 0;
    
    studyRunId : string;
    resetScale = 0;
    resetSelection = 0;
    logsRequested = 0;
    currentTaskLog: {
        mainTarget: number,
        target: number,
        targetBBox: {width: number, height: number, x: number, y: number},
        previousTarget: number,
        previousTargets: number[],
        distance: number,
        clickedTargets: number[],
        settingsIndex: number,
        currentRunPerBranch: number,
        taskTime: number,
        zoomInTimes: number[],
        zoomOutTimes: number[],
        panTimes: number[],
        totalIdleTime: number,
        totalZoomInTime: number,
        totalZoomOutTime: number,
        totalPanTime: number,
        startTime: number,
        statusTimeline: { state: string, start: number, end: number, duration: number }[],
        scaleTimeline: { time: number, start: number, end: number }[]
    };
    
    studyStarted = Date.now();
    lastStateSetTime = 0;
    stateSetToIdleTimeout = null;
    currentState: number = StudyComponent.STATES.IDLE;
    replayLogs = null;
    logStart = this.start;
    logEnd = this.end;
    isOnCombos = false;
    
    currentSetting;
    currentSettings: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[] = [];
    currentSettingsIndex = 0;
    studySettings : {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[];
    
    MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    setCombo(combo)
    {
        this.combo = combo;
        this.zoomModes = combo.modes.map(number => this.allZoomModes[number]);
        
        window.setTimeout(() => this.showVis = true, 50);
    }
    
    setSettings(settings: {vertical: boolean, combo: {}, numberMode: boolean})
    {
        this.vertical = settings.vertical;
        this.numberMode = settings.numberMode;
        this.setCombo(settings.combo);
    }
    
    isTestRun()
    {
        return this.currentRunPerBranch < this.NUMBER_TEST_RUNS;
    }
    
    submitForm()
    {
        this.db.object('metadata/' + this.studyRunId + '/gender').set(this.formdata.gender);
        this.db.object('metadata/' + this.studyRunId + '/age').set(this.formdata.age);
        this.db.object('metadata/' + this.studyRunId + '/pc-use').set(this.formdata['pc-use']);
        this.db.object('metadata/' + this.studyRunId + '/mobile-use').set(this.formdata['mobile-use']);
        this.db.object('metadata/' + this.studyRunId + '/feedback').set(this.formdata.feedback);
    }
    
    finishExperimentData()
    {
        const metaDataObject = this.db.object('metadata/' + this.studyRunId);
        metaDataObject.set({
            start: this.studyStarted,
            end: Date.now(),
            duration: Date.now() - this.studyStarted,
            mturkId: '',
            feedback: '',
            age: 0,
            gender: '',
            'pc-use': -1,
            'mobile-use': -1,
            width: this.width,
            height: this.height,
            browserInfo: this.browserinfo.getAllBrowserData(),
            href: window.location.href,
            pathname: window.location.pathname
        });
    }
    
    saveLogs(eventLogs)
    {
        const settingId = this.experimentsettingsService.getSettingId(this.currentSetting);
        const runId = this.isTestRun() ? 'testrun-' + (this.currentRunPerBranch + 1) : 'realrun-' + (this.currentRunPerBranch + 1 - this.NUMBER_TEST_RUNS);
        const taskId = 'dist-' + this.currentTaskLog.distance;
        const path = this.studyRunId + '/' + settingId + '/' + runId + '/' + taskId + '/';
    
        const eventLogObject = this.db.object('eventlogs/' + path);
        const interactionLogObject = this.db.object('interactionlogs/' + path);
    
        eventLogObject.set(eventLogs);
        interactionLogObject.set(this.currentTaskLog);
        
        if(this.hasAllTasksFinished)
        {
            this.finishExperimentData();
        }
    }
    
    constructor(db: AngularFireDatabase, comboService: ComboService, route: ActivatedRoute, randomstringService: RandomstringService, experimentsettingsService: ExperimentsettingsService, private browserinfo: BrowserinfoService)
    {
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }
        
        this.db = db;
        this.randomstringService = randomstringService;
        this.comboService = comboService;
        this.experimentsettingsService = experimentsettingsService;
        let studyId = route.snapshot.paramMap.get('studyId');
        
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            this.mobile = true;
        }
        this.platform = this.mobile ? 'MOBILE' : 'PC';

        
        const path = route.snapshot.url[0].path.toString();
        this.isOnCombos = path === 'combos';
        
        if (path !== 'combos')
        {
            studyId = this.experimentsettingsService.getStudyShorthand(studyId);
            this.studyRunId = studyId + this.platform[0] + '-' + this.randomstringService.getRandomString(6);
            this.studySettings = experimentsettingsService.getStudySettings(studyId);

            this.currentSettings = shuffleArray(this.studySettings.filter(s => s.mobile === this.mobile));
            this.currentSettingsIndex = 0;
            this.currentSetting = this.currentSettings[this.currentSettingsIndex];
            this.setCurrentSetting();
            this.comboSelection = false;
            // this.startExperimentData();
        }
        else
        {
            comboService.generateCombos(this.mobile, true);
            this.combinations = comboService.getCombosRandomOrder(this.mobile, !this.mobile);
            this.comboSelection = true;
        }
    }
    
    setCurrentSetting()
    {
        this.comboService.generateCombos(this.mobile, this.currentSetting.vertical);
        this.combinations = this.comboService.getCombosRandomOrder(this.mobile, !this.mobile);
    
        this.setSettings({
            combo: this.comboService.getComboById(this.currentSetting.comboid),
            numberMode: this.currentSetting.numberMode,
            vertical: this.currentSetting.vertical
        });
    }
    
    startTests()
    {
        this.resetVisScale();
        
        this.readyForTasks = true;
        
        setTimeout(() =>
        {
            this.currentRunPerBranch = 0;
            this.setCurrentTargets(this.targets[this.currentRunTotal]);
            this.test_running = true;
        }, 1000);
    }
    
    resetVisScale()
    {
        this.start = this.defaultStart;
        this.end = this.defaultEnd;
        this.resetScale = Math.random() * 10000;
        this.logStart = this.start;
        this.logEnd = this.end;
    }
    
    setCurrentTargets(firstTarget)
    {
        this.targetDistances = this.isTestRun() ? StudyComponent.TARGET_DISTANCES_TEST : StudyComponent.TARGET_DISTANCES_REAL;
        if(this.studyRunId.substr(0,4) === 'SZ00')
        {
            this.targetDistances = this.isTestRun() ? StudyComponent.TARGET_DISTANCES_TEST_ODD : StudyComponent.TARGET_DISTANCES_REAL_ODD;
        }
        this.currentTargets = [firstTarget];
        let previousTarget = firstTarget;
        for (const distance of this.targetDistances)
        {
            previousTarget += distance;
            this.currentTargets.push(previousTarget);
        }
        
        this.currentMainTarget = firstTarget;
        this.setNextCurrentTarget(true);
    }
    
    setNextCurrentTarget(firstTarget?: boolean)
    {
        this.interactionDisabled = false;
        this.test_running = true;
        this.resetSelection++;
        
        if (firstTarget)
        {
            this.currentTargetDistance = 0;
            this.currentTarget = this.currentMainTarget;
        }
        else
        {
            const unfinishedDistances = this.targetDistances.filter(d => this.finishedDistances.indexOf(d) === -1);
            if (unfinishedDistances.length === 0)
            {
                this.currentTarget = null;
                return;
            }
            
            const index = Math.round(Math.random() * (unfinishedDistances.length - 1));
            this.currentTargetDistance = unfinishedDistances[index];
        }
        
        const randomSign = Math.round(Math.random()) * 2 - 1;
        this.currentTarget += randomSign * this.currentTargetDistance;
        this.currentTaskStart = Date.now();
        this.clickedTargets = [];
        
        const prevTarget = this.finishedTargets.length === 0 ? null : this.finishedTargets[this.finishedTargets.length - 1];
        this.currentTaskLog = {
            mainTarget: this.currentMainTarget,
            target: this.currentTarget,
            targetBBox: {width: 0, height: 0, x: 0, y: 0},
            previousTarget: prevTarget,
            previousTargets: this.finishedTargets,
            settingsIndex: this.currentSettingsIndex,
            currentRunPerBranch: this.currentRunPerBranch,
            distance: this.currentTargetDistance,
            clickedTargets: this.clickedTargets,
            taskTime: 0,
            zoomInTimes: [],
            zoomOutTimes: [],
            panTimes: [],
            totalIdleTime: 0,
            totalZoomInTime: 0,
            totalZoomOutTime: 0,
            totalPanTime: 0,
            startTime: Date.now(),
            statusTimeline: [{
                start: Date.now(),
                end: 0,
                duration: 0,
                state: StudyComponent.STATE_NAMES[StudyComponent.STATES.IDLE]
            }],
            scaleTimeline: []
        };
        this.logScale();
    }
    
    ngAfterViewInit()
    {
        window.setTimeout(() =>
        {
            this.width = this.container.nativeElement.clientWidth;
            this.height = this.container.nativeElement.clientHeight - 100;
            
            window.setTimeout(() => this.loadVis = true, 200);
        });
    }
    
    requestLogs()
    {
        this.logsRequested++;
    }
    
    targetClicked(targetInfo: {number: number, dateNumbers?: { year: number, month: number, day: number, hour: number, minute: number }, bbox: {width: number, height: number, x: number, y: number}})
    {
        const target = targetInfo.number;
        
        this.selectedTarget = target;
        this.clickedTargets.push(target);
        
        let targetClicked = target === this.currentTarget;
        
        /*if(targetInfo.dateNumbers)
        {
            let date = new Date(this.currentTarget * this.DATE_SCALE);
            //console.log(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes());
            //console.log(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes());
            //console.log(targetInfo.dateNumbers);
            const num = targetInfo.dateNumbers;
    
            targetClicked = date.getFullYear() === num.year
                && date.getMonth() === num.month
                && date.getDate() === num.day
                && date.getHours() === num.hour
                && date.getMinutes() === num.minute;
        }*/
        
        if (targetClicked)
        {
            this.currentTaskLog.taskTime = Date.now() - this.currentTaskStart;
            this.currentTaskLog.targetBBox.width = targetInfo.bbox.width;
            this.currentTaskLog.targetBBox.height = targetInfo.bbox.height;
            this.currentTaskLog.targetBBox.x = targetInfo.bbox.x;
            this.currentTaskLog.targetBBox.y = targetInfo.bbox.y;
            
            const lastStatus = this.currentTaskLog.statusTimeline[this.currentTaskLog.statusTimeline.length - 1];
            lastStatus.end = Date.now();
            lastStatus.duration = lastStatus.end - lastStatus.start;
            this.logScale();
            
            this.finishedTargets.push(target);
            this.finishedTotalTargetsCount++;
            this.finishedDistances.push(this.currentTargetDistance);
            this.test_running = false;
    
            const unfinishedDistances = this.targetDistances.filter(d => this.finishedDistances.indexOf(d) === -1);
            const runFinished = unfinishedDistances.length === 0;
            this.hasNextTarget = !runFinished;
            this.interactionDisabled = true;
            if(runFinished)
            {
                this.hasNextRun = this.currentRunPerBranch < this.NUMBER_RUNS_PER_SETTING - 1;
                if(!this.hasNextRun)
                {
                    this.hasNextSetting = this.currentSettingsIndex < this.currentSettings.length - 1;
                    if(!this.hasNextSetting)
                    {
                        this.hasAllTasksFinished = true;
                    }
                }
            }
    
            this.updateProgress();
            this.requestLogs();
        }
    }
    
    nextRun(startFirstTask: boolean = true)
    {
        this.resetVisScale();
        this.currentRunPerBranch++;
        this.currentRunTotal++;
        this.interactionDisabled = false;
        this.currentTarget = 0;
        this.resetSelection++;
        this.waiting = startFirstTask;
        this.finishedDistances = [];
        this.updateProgress();
    
        if(startFirstTask)
        {
            setTimeout(() =>
            {
                this.waiting = false;
                this.setCurrentTargets(this.targets[this.currentRunTotal]);
                this.test_running = true;
            }, 1000);
        }
    }
    
    finish()
    {
        this.loadVis = false;
        this.hasCompletelyFinished = true;
        this.combo = null;
        this.updateProgress();
    }
    
    nextSetting()
    {
        this.currentRunPerBranch = 0;
        this.currentSettingsIndex++;
        this.currentSetting = this.currentSettings[this.currentSettingsIndex];
        this.readyForTasks = false;
        this.setCurrentSetting();
        this.nextRun(false);
        this.updateProgress();
    }
    
    resetCombo()
    {
        this.showVis = false;
        this.combo = null;
    }
    
    zoomedIn(zoomInfo: {relativeChange: number, rangeStart: number, rangeEnd: number})
    {
        if(!this.currentTaskLog) return;
    
        if (!this.currentTaskLog.zoomInTimes.length || Date.now() - this.currentTaskLog.zoomInTimes[this.currentTaskLog.zoomInTimes.length - 1] > 999)
        {
            this.currentTaskLog.zoomInTimes.push(Date.now());
        }
        this.logScale(zoomInfo.rangeStart, zoomInfo.rangeEnd);
        this.setState(StudyComponent.STATES.ZOOM_IN);
    }
    
    zoomedOut(zoomInfo: {relativeChange: number, rangeStart: number, rangeEnd: number})
    {
        if(!this.currentTaskLog) return;
        
        if (!this.currentTaskLog.zoomOutTimes.length || Date.now() - this.currentTaskLog.zoomOutTimes[this.currentTaskLog.zoomOutTimes.length - 1] > 999)
        {
            this.currentTaskLog.zoomOutTimes.push(Date.now());
        }
        this.logScale(zoomInfo.rangeStart, zoomInfo.rangeEnd);
        this.setState(StudyComponent.STATES.ZOOM_OUT);
    }
    
    panned(panInfo: {rangeChange: number, rangeStart: number, rangeEnd: number})
    {
        if(!this.currentTaskLog) return;
        
        if (!this.currentTaskLog.panTimes.length || Date.now() - this.currentTaskLog.panTimes[this.currentTaskLog.panTimes.length - 1] > 999)
        {
            this.currentTaskLog.panTimes.push(Date.now());
        }
        this.logScale(panInfo.rangeStart, panInfo.rangeEnd);
        this.setState(StudyComponent.STATES.PAN);
    }
    
    logScale(start : number = this.logStart, end : number = this.logEnd)
    {
        this.logStart = start;
        this.logEnd = end;
        this.currentTaskLog.scaleTimeline.push({time: Date.now(), start: this.logStart, end: this.logEnd});
    }
    
    setState(number: number)
    {
        const lastStatus = this.currentTaskLog.statusTimeline[this.currentTaskLog.statusTimeline.length - 1];
        const currentStateName: string = StudyComponent.STATE_NAMES[number];
        
        if (lastStatus.state !== currentStateName)
        {
            lastStatus.end = Date.now();
            lastStatus.duration = lastStatus.end - lastStatus.start;
            
            if (number === StudyComponent.STATES.IDLE)
            {
                this.currentTaskLog.totalIdleTime += lastStatus.duration;
            }
            else if (number === StudyComponent.STATES.ZOOM_IN)
            {
                this.currentTaskLog.totalZoomInTime += lastStatus.duration;
            }
            else if (number === StudyComponent.STATES.ZOOM_OUT)
            {
                this.currentTaskLog.totalZoomOutTime += lastStatus.duration;
            }
            else if (number === StudyComponent.STATES.PAN)
            {
                this.currentTaskLog.totalPanTime += lastStatus.duration;
            }
            
            this.currentTaskLog.statusTimeline.push({
                start: Date.now(),
                end: 0,
                duration: 0,
                state: currentStateName
            });
            this.currentState = number;
        }
        
        this.lastStateSetTime = Date.now();
        
        if (this.currentState !== StudyComponent.STATES.IDLE)
        {
            clearTimeout(this.stateSetToIdleTimeout);
            
            this.stateSetToIdleTimeout = setTimeout(() =>
            {
                if (Date.now() - this.lastStateSetTime > 700)
                {
                    this.setState(StudyComponent.STATES.IDLE);
                }
            }, 800);
        }
    }
    
    updateProgress()
    {
        const totalTargets = this.currentSettings.length * (StudyComponent.TARGET_DISTANCES_TEST.length + 2 * StudyComponent.TARGET_DISTANCES_REAL.length);
        this.progress = this.finishedTotalTargetsCount / totalTargets;
    }
    
    reportBug()
    {
        let bugId = this.randomstringService.getRandomString(4);
        this.requestLogs();
    
        const metaDataObject = this.db.object('bugreports/' + bugId);
        metaDataObject.set({
            studyRunId: this.studyRunId,
            start: this.studyStarted,
            currentTask: this.currentTarget,
            currentTaskDate: new Date(this.currentTarget * this.DATE_SCALE).toString(),
            currentSelection: this.selectedTarget,
            currentSelectionDate: new Date(this.selectedTarget * this.DATE_SCALE).toString(),
            clickedTargets: this.clickedTargets,
            end: Date.now(),
            duration: Date.now() - this.studyStarted,
            mturkId: '',
            width: this.width,
            height: this.height,
            browserInfo: this.browserinfo.getAllBrowserData(),
            href: window.location.href,
            pathname: window.location.pathname,
            time: Date.now(),
            date: new Date().toString()
        });
        
        alert('Sorry you encountered a bug. Please send us your bug id B-' + bugId + ' and a screenshot to intervis.neu@gmail.com and we will get back to you. Sorry for the inconvenience.');
    }
    
    numberToDateString(number : number) : string
    {
        let date = new Date(number * this.DATE_SCALE);
        let string = '';
        let hours = date.getUTCHours();
        let amPm = hours > 11 ? 'pm' : 'am';
        let americanHours = hours > 12 ? hours - 12 : hours;
        if(hours === 0) americanHours = 12;
        const minutes = date.getUTCMinutes() < 10 ? '0' + date.getUTCMinutes() : date.getUTCMinutes().toString();
        
        string += date.getUTCFullYear() + ' ';
        string += this.MONTH_NAMES[date.getUTCMonth()] + ' ';
        string += date.getUTCDate() + ', ';
        string += americanHours + ':';
        string += minutes + ' ';
        string += amPm;
        
        return string;
    }
    
    // This is for iPhone..
    @HostListener('touchstart', ['$event']) onTouchStart(event: TouchEvent)
    {
        const target = <HTMLElement> event.target;
        if(event.touches.length == 2 && target.tagName.toLowerCase() !== 'svg')
        {
            event.preventDefault();
        }
    }
    
    @HostListener('touchmove', ['$event']) onTouchMove(event: TouchEvent)
    {
        const target = <HTMLElement> event.target;
        if(event.touches.length == 2 && target.tagName.toLowerCase() !== 'svg')
        {
            event.preventDefault();
        }
    }
    
    @HostListener('window:beforeunload', ['$event'])
    onLeave(event)
    {
        if(!this.showCode && !this.isOnCombos)
        {
            const message = 'This will discard your data from your study and not count as completing the HIT. Continue?';
    
            if (event) {
                event.returnValue = message;
            }
            return message;
        }
    }
}
