import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component';
import { CodableTimelineComponent } from './codable-timeline/codable-timeline.component';
import {NumberVisComponent} from './number-vis/number-vis.component';
import {AnimationService} from '../services/animation.service';
import {ZoomComponent} from './zoomable/zoomable.component';
import {ManualComponent} from './manual/manual.component';
import {MTurkComponent} from './mturk/mturk.component';
import {LoggerComponent } from './logger/logger.component';
import {AngularFireModule} from 'angularfire2';
import {AngularFireDatabaseModule} from 'angularfire2/database';
import {environment} from '../environments/environment';
import {RouterModule, Routes} from '@angular/router';
import {ComboService} from '../services/combo.service';
import {AnalysisComponent} from './analysis/analysis.component';
import {StudyComponent} from './study/study.component';
import {RoundPipe} from '../services/round.pipe';
import {RandomstringService} from 'services/randomstring.service';
import {ExperimentsettingsService} from '../services/experimentsettings.service';
import {TruncatePipe} from '../services/truncate.pipe';
import {BrowserinfoService} from '../services/browserinfo.service';
import {HomeComponent} from './home/home.component';
import {HttpModule} from '@angular/http';
import {NumberToArrayPipe} from '../services/numbertoarray.pipe';
import {MedianPipe} from '../services/median.pipe';
import {StdevPipe} from '../services/stdev.pipe';
import {AveragePipe} from '../services/average.pipe';
import {StdeverrorPipe} from '../services/stdeverror.pipe';
import {FilteroutextremevaluesPipe} from '../services/filteroutextremevalues.pipe';
import {RunData} from './analysis/runData';
import {SubtractIndividuallyPipe} from 'services/subtractindividually.pipe';
import {LogsComponent} from './analysis/logs.component';
import {TablesComponent} from './analysis/tables.component';
import {FilterHighValuesService} from '../services/filterHighValues.service';
import {BehaviourtimelineComponent} from './analysis/behaviourtimeline.component';
import {StatedistributionComponent} from "./analysis/statedistribution.component";

const appRoutes: Routes = [
    { path: 'combos',     component: StudyComponent },
    { path: 'manual', component: ManualComponent },
    { path: 'study', component: StudyComponent },
    { path: 'study/:studyId', component: StudyComponent },
    { path: 'szd', component: MTurkComponent },
    { path: 'szm', component: MTurkComponent },
    { path: 'szd/:studyId', component: MTurkComponent },
    { path: 'szm/:studyId', component: MTurkComponent },
    { path: 'analysis', component: AnalysisComponent },
    { path: 'logs', component: LogsComponent },
    { path: 'tables', component: TablesComponent },
    { path: 'behaviourtimelines', component: BehaviourtimelineComponent },
    { path: 'states', component: StatedistributionComponent },
    { path: '', component: HomeComponent },
    /*{ path: '',
        redirectTo: '/szd',
        pathMatch: 'full'
    },*/
];

@NgModule({
  declarations: [
    AppComponent,
    ManualComponent,
    MTurkComponent,
    StudyComponent,
    CodableTimelineComponent,
    BehaviourtimelineComponent,
    ZoomComponent,
    NumberVisComponent,
    LoggerComponent,
    AnalysisComponent,
    LogsComponent,
    TablesComponent,
    HomeComponent,
    StatedistributionComponent,
    RoundPipe,
    TruncatePipe,
    NumberToArrayPipe,
    MedianPipe,
    StdevPipe,
    StdeverrorPipe,
    SubtractIndividuallyPipe,
    AveragePipe,
    FilteroutextremevaluesPipe,
    FilterHighValuesService
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RunData,
    RouterModule.forRoot(appRoutes),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule
  ],
  providers: [AnimationService, ComboService, RandomstringService, ExperimentsettingsService, BrowserinfoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
