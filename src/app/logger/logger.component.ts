import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'logger',
    templateUrl: 'logger.component.html',
    styleUrls: ['./logger.component.css']
})
export class LoggerComponent implements AfterViewInit
{
    clientRect : { left: number, top: number, right: number, bottom: number, width: number, height: number };
    
    el;
    events = [];
    replayPointerPositions = [];
    
    relativePos = {x: 0, y: 0};
    
    stopListening = false;
    
    @Input() targetClassName : string;
    @Output() logsReady = new EventEmitter<any>();
    replayCancelled = false;
    replayMouseDown = false;
    
    constructor(el: ElementRef)
    {
        this.el = el;
        
        let addListener = (eventTypeName) =>
        {
            el.nativeElement.addEventListener(eventTypeName, (event) => {
                this.logEvent(eventTypeName, event);
            });
        };
        
        addListener('mousedown');
        addListener('mousemove');
        addListener('mouseup');
        addListener('touchstart');
        addListener('touchmove');
        addListener('touchend');
        addListener('wheel');
        
        /*window.setTimeout(() =>
        {
            this.stopListening = true;
            this.replayEvents();
        }, 5000);*/
    }
    
    ngAfterViewInit(): void
    {
        let rect = this.el.nativeElement.getBoundingClientRect();
        this.clientRect = {top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
        this.clientRect.top = 0;
        // Do not know why I have to do this
    }
    
    @Input()
    set logsRequested(requested: number)
    {
        if(requested)
        {
            this.logsReady.emit(this.getLogs());
            this.events = [];
        }
    }
    
    @Input()
    set replayLogs(data: any)
    {
        if(data)
        {
            this.replayCancelled = false;
            this.stopListening = true;
            this.events = data;
            window.setTimeout(() => this.replayEvents(), 2000);
        }
        else
        {
            this.replayCancelled = true;
        }
    }
    
    logEvent(eventTypeName: string, event: MouseEvent|TouchEvent)
    {
        if(this.stopListening) return;
    
        let eventData = {
            type: eventTypeName,
            positions: [],
            time: Date.now(),
            wheelDelta: 0,
            deltaX: 0,
            deltaY: 0
        };
    
        if(event instanceof WheelEvent)
        {
            const delta = event.wheelDelta ? event.wheelDelta : -1 * event.deltaY;
            
            eventData.positions = [this.getPosition(event)];
            eventData.wheelDelta = delta;
            eventData.deltaX = event.deltaX;
            eventData.deltaY = event.deltaY;
        }
        else if(event instanceof MouseEvent && event.clientX)
        {
            eventData.positions = [this.getPosition(event)];
        }
        else if(event instanceof TouchEvent)
        {
            let touches = [];
            if(event.touches.length == 1) touches = [event.touches[0]];
            if(event.touches.length == 2) touches = [event.touches[0], event.touches[1]];
    
            eventData.positions = touches.map(touch => { return this.getPosition(touch); });
        }
        
        this.events.push(eventData);
    }
    
    getPosition(data: {clientX: number, clientY: number}) : {x: number, y: number}
    {
        return { x: data.clientX - this.clientRect.left, y: data.clientY - this.clientRect.top };
    }
    
    getLogs()
    {
        return this.events;
    }
    
    replayEvents()
    {
        console.log('replaying ', this.events.length, ' events.');
        
        if(!this.events.length || this.replayCancelled)
        {
            return;
        }
        
        let lastEventTime = this.events[0].time;
        let index = 0;
        this.replayEvent(this.events[0]);
        
        let recursiveReplay = () =>
        {
            if(this.replayCancelled)
            {
                return;
            }
            
            index++;
            if(this.events[index])
            {
                let diff = this.events[index].time - lastEventTime;
                window.setTimeout(() =>
                {
                    this.replayEvent(this.events[index]);
                    lastEventTime = this.events[index].time;
                    recursiveReplay();
                }, diff);
            }
        };
        recursiveReplay();
    }
    
    replayEvent(eventData)
    {
        this.replayPointerPositions = eventData.positions;
        let target = document.getElementsByClassName(this.targetClassName)[0];
        //let target = this.el.nativeElement;
        //let target = eventData.target;
        
        if(eventData.type.substr(0, 'mouse'.length) == 'mouse')
        {
            if(eventData.type == 'mousedown')
            {
                this.replayMouseDown = true;
            }
            else if(eventData.type == 'mouseup')
            {
                this.replayMouseDown = false;
            }
            
            let data = { clientX: eventData.positions[0].x, clientY: eventData.positions[0].y };
            let event = new MouseEvent(eventData.type, data);
            event.initEvent(eventData.type, true, true);
            
            target.dispatchEvent(event);
        }
        else if(eventData.type.substr(0, 'touch'.length) == 'touch')
        {
            this.replayMouseDown = true;
            
            //let positions = [];
            let touches : Touch[] = [];
            //let touchList : TouchList;
            
            //document.initTouchEvent();
            
            //let touchList = new TouchList();
            //let touches = new TouchList();
            let positions = eventData.positions ? eventData.positions : [];
            /*
            if(positions.length === 1)
            {
                touchList = document.createTouchList(positions[0]);
            }
            else if(positions.length === 2)
            {
                touchList = document.createTouchList(positions[0], positions[1]);
            }*/
            
            if(eventData.positions)
            {
                for(let pos of eventData.positions)
                {
                    //positions.push({clientX: pos.x, clientY: pos.y});
                    //const touch = new Touch({identifier: Date.now(), clientX: pos.x, clientY: pos.y, pageX: 0, pageY: 0, screenX: 0, screenY: 0, target: target});
                    //let touch : Touch = {clientX: pos.x, clientY: pos.y};
                    //positions.push({identifier: Date.now(), clientX: pos.x, clientY: pos.y});
                    //touch.clientX = 3;
                    //touches.push(touch);
                    //touches[touches.length] = {clientX: pos.x, clientY: pos.y};
                    //touches.push({clientX: pos.x, clientY: pos.y});
                    let touch : Touch = {identifier: Date.now(), clientX: pos.x, clientY: pos.y, pageX: 0, pageY: 0, screenX: 0, screenY: 0, target: target};
                    touches.push(touch);
                    //touchList[touchList.length] = touch;
                }
            }
            //let touchList : TouchList = touches;
    
            let touchesSimpleTouchList : TouchList = positions.map(pos => { return {clientX: pos.x, clientY: pos.y};});
            let touchesSimple : TouchList = positions.map(pos => { return {clientX: pos.x, clientY: pos.y};});
            let data : TouchEventInit = { touches: touches };
            
            //let data = { touches: positions };
            //let event = new TouchEvent(eventData.type, data);
            //let event = document.createEvent('TouchEvent');
    
            let eventI = {
                altKey: false,
                changedTouches: touchesSimple,
                bubbles: true,
                cancelBubble: true,
                cancelable: true,
                targetTouches: touchesSimple,
                touches: touchesSimple,
                srcElement: target,
                target: target,
                timeStamp: Date.now(),
                type: eventData.type
            };
            
            
            /*let eventI : TouchEvent = {
                altKey: false,
                detail: 0,
                view: Window.prototype,
                initUIEvent: null,
                initEvent: null,
                changedTouches: touchesSimple,
                charCode: 0,
                ctrlKey: false,
                keyCode: 0,
                metaKey: false,
                shiftKey: false,
                bubbles: true,
                cancelBubble: true,
                cancelable: true,
                targetTouches: touchesSimple,
                touches: touchesSimple,
                which: 0,
                currentTarget: target,
                defaultPrevented: false,
                preventDefault: () => {},
                eventPhase: 0,
                isTrusted: true,
                returnValue: null,
                srcElement: target,
                target: target,
                timeStamp: Date.now(),
                type: 'TouchEvent',
                scoped: false,
                stopImmediatePropagation: () => {},
                stopPropagation: () => {},
                deepPath: null,
                AT_TARGET: 0,
                BUBBLING_PHASE: 0,
                CAPTURING_PHASE: 0
            };*/
            
            /*
            let event : TouchEvent = {
                altKey: false,
                changedTouches: touches,
                charCode: 0,
                ctrlKey: false,
                keyCode: 0,
                metaKey: false,
                shiftKey: false,
                targetTouches: touches,
                touches: touches,
                which: 0
            };*/
            
            let event = new Event('TouchEvent', eventI);
            event.initEvent(eventData.type, true, true);
            event['touches'] = touchesSimple;
            target.dispatchEvent(event);
        }
        else if(eventData.type.substr(0, 'wheel'.length) == 'wheel')
        {
            let data = { clientX: eventData.positions[0].x, clientY: eventData.positions[0].y, deltaX: eventData.deltaX, deltaY: eventData.deltaY };
            let event = new WheelEvent(eventData.type, data);
    
            event.initEvent(eventData.type, true, true);
            target.dispatchEvent(event);
        }
    }
}
