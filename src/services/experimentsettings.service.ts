import { Injectable } from '@angular/core';
import {AngularFireDatabase} from 'angularfire2/database';

@Injectable()
export class ExperimentsettingsService
{
    onReadyPromise: Promise<void>;
    mobile = false;
    
    settingsStudy0: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[] = [
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: 'standard: flick pan, pinch zoom.',
            vertical: false,
            numberMode: false
        },
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: 'standard: flick pan, pinch zoom.',
            vertical: false,
            numberMode: true
        },
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: 'standard: normal pan, scroll wheel zoom.',
            vertical: false,
            numberMode: false
        },
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: 'standard: normal pan, scroll wheel zoom.',
            vertical: false,
            numberMode: true
        }];
    
    settingsStudy1: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[] = [
        // Mobile
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: 'standard: flick pan, pinch zoom.',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: 'standard: flick pan, pinch zoom.',
            vertical: false,
            numberMode: false
        },
        {
            comboid: 'normalpan-dynamiczoomxadjustable',
            mobile: true,
            title: 'dynamic zoom normal pan vertical',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-dynamiczoomxadjustable',
            mobile: true,
            title: 'dynamic zoom normal pan vertical horizontal',
            vertical: false,
            numberMode: false
        },
        // Desktop
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: 'standard: normal pan, scroll wheel zoom.',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: 'standard: normal pan, scroll wheel zoom.',
            vertical: false,
            numberMode: false
        },
        {
            comboid: 'wheelpan-brushzoomin-dblclickzoomout',
            mobile: false,
            title: 'scrollwheel pan, brush zoom in, dblclick zoom out',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'wheelpan-brushzoomin-dblclickzoomout',
            mobile: false,
            title: 'scrollwheel pan, brush zoom in, dblclick zoom out',
            vertical: false,
            numberMode: false
        }
    ];
    settingsStudy2: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[] = [
        //////// COMPUTER //////////
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-holdzoomin-holdzoomout',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-dblclickzoomin-holdzoomout',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        ///////// MOBILE ////////
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-holdzoomin-holdzoomout',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'pinchpan-brushzoomin-dblclickzoomout',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        }
    ];
    
    settingsStudy3: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean}[] = [
        //////// COMPUTER //////////
        {
            comboid: 'normalpan-wheelzoom',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-dynamiczoomxadjustable',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-rubzoominx-rubzoomouty',
            mobile: false,
            title: '',
            vertical: true,
            numberMode: false
        },
        ///////// MOBILE ////////
        {
            comboid: 'normalpan-pinchzoom',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-holdzoomin-holdzoomout',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-dblclickzoomin-holdzoomout',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        },
        {
            comboid: 'normalpan-rubzoominx-rubzoomouty',
            mobile: true,
            title: '',
            vertical: true,
            numberMode: false
        }
    ];
    
    studies = [
        {
            title: 'Timeline Study 1',
            description: 'Investigating Navigation Visualizations by comparing dates with numbers.',
            id: 'SZ00',
            duration: { mobile: 25, computer: 25 },
            pay: { mobile: 2.08, computer: 2.08 },
            settings: this.settingsStudy0
        },
        {
            title: 'Timeline Study 2',
            description: 'Investigating Navigation by comparing horizontal with vertical timelines.',
            id: 'SZ01',
            duration: { mobile: 50, computer: 40},
            pay: { mobile: 5.87, computer: 4.16},
            settings: this.settingsStudy1
        },
        {
            title: 'Timeline Study 3',
            description: 'Investigating Navigation Techniques.',
            id: 'SZ02',
            duration: {mobile: 45, computer: 35},
            pay: {mobile: 5.87, computer: 4.16},
            settings: this.settingsStudy2
        },
        {
            title: 'Timeline Study 4',
            description: 'Investigating Navigation Techniques.',
            id: 'SZ03',
            duration: {mobile: 60, computer: 35},
            pay: {mobile: 7.50, computer: 4.16},
            settings: this.settingsStudy3
        }
    ];
    
    currentStudyId = '';
    currentStudy = this.studies[4];
    
    constructor(private db: AngularFireDatabase)
    {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            this.mobile = true;
        }
    
        this.onReadyPromise = new Promise<void>((resolve, reject) =>
        {
            const currentSettingObject = this.db.object('settings/current-setting');
            currentSettingObject.subscribe(setting =>
            {
                this.currentStudyId = setting.$value;
                this.currentStudy = this.studies.filter(s => s.id === this.currentStudyId)[0];
                resolve();
            });
        });
        
        // metaDataFeedbackObject.set('SZ00');
    }
    
    public ready(): Promise<void>
    {
        if (!this.currentStudyId)
        {
            return this.onReadyPromise;
        }
        else
        {
            return new Promise<void>((resolve, reject) => {
                resolve();
            });
        }
    }
    
    public getStudy(studyShort?: string)
    {
        return !studyShort ? this.currentStudy : this.studies.filter(s => s.id === studyShort)[0];
    }
    
    public getStudySettings(studyShort?: string)
    {
        return this.getStudy(studyShort).settings;
    }
    
    getSettingId(setting: {comboid: string, mobile: boolean, numberMode: boolean, title: string, vertical: boolean})
    {
        const orientation = setting.vertical ? 'vertical' : 'horizontal';
        const numberMode = setting.numberMode ? 'numbers' : 'dates';
        return orientation + '-' + numberMode + '-' + setting.comboid;
    }
    
    public getStudyShorthand(studyShort?: string): string
    {
        return this.getStudy(studyShort).id;
    }
}
