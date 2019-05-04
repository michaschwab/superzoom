import { Injectable } from '@angular/core';

@Injectable()
export class ComboService
{
    public static MODES = {'HOLD_ZOOM_IN': 0, 'HOLD_ZOOM_OUT': 1, 'CLICK_HOLD_ZOOM_IN': 2, 'CLICK_HOLD_ZOOM_OUT': 3, 'SIMPLE_PAN': 4, 'DBLCLICK_ZOOM_IN': 5, 'DBLCLICK_ZOOM_OUT': 6, 'DBLRIGHTCLICK_ZOOM_IN': 7, 'DBLRIGHTCLICK_ZOOM_OUT': 8, 'WHEEL_ZOOM': 9, 'WHEEL_PAN_X': 10, 'WHEEL_PAN_Y': 11, 'BRUSH_ZOOM_X': 12, 'BRUSH_ZOOM_Y': 13, 'BRUSH_ZOOM_2D': 14, 'DYNAMIC_ZOOM_X_STATIC': 15, 'DYNAMIC_ZOOM_X_ORIGINAL_PAN': 16, 'DYNAMIC_ZOOM_X_NORMAL_PAN': 17, 'DYNAMIC_ZOOM_X_ADJUSTABLE': 18, 'DYNAMIC_ZOOM_Y_STATIC': 19, 'DYNAMIC_ZOOM_Y_ORIGINAL_PAN': 20, 'DYNAMIC_ZOOM_Y_NORMAL_PAN': 21, 'DYNAMIC_ZOOM_Y_ADJUSTABLE': 22, 'PINCH_ZOOM': 23, 'PINCH_ZOOM_QUADRATIC': 24, 'PINCH_ZOOM_POWER_FOUR': 25, 'FLICK_PAN': 26, 'RUB_ZOOM_IN_X': 27, 'RUB_ZOOM_IN_Y': 28, 'RUB_ZOOM_OUT_X': 29, 'RUB_ZOOM_OUT_Y': 30, 'PINCH_PAN': 31, 'WHEEL_ZOOM_MOMENTUM': 32, 'PINCH_ZOOM_MOMENTUM': 33 };
    public static DEFAULT_MODES = {
        'PAN': { 'PC': ComboService.MODES.SIMPLE_PAN, 'MOBILE': ComboService.MODES.FLICK_PAN }
    };
    combinations = [];
    
    constructor()
    {
    }
    
    generateCombos(mobile: boolean, vertical: boolean)
    {
    
        let platform = mobile ? 'MOBILE' : 'PC';
        let normalPan = ComboService.DEFAULT_MODES.PAN[platform];
        const primaryForward = vertical ? 'down' : 'right';
        const primaryBackward = vertical ? 'up' : 'left';
        const secondaryForward = vertical ? 'right' : 'down';
        const secondaryBackward = vertical ? 'left' : 'up';
        const primaryAxis = vertical ? 'vertical' : 'horizontal';
        const secondaryAxis = !vertical ? 'vertical' : 'horizontal';
    
        this.combinations = [{
            id: 'normalpan-wheelzoom',
            modes: [normalPan, ComboService.MODES.WHEEL_ZOOM],
            title: 'Normal Pan and Wheel Zoom',
            description: 'drag the timeline back and forth, and use the scrollwheel to zoom in and out.',
            mobile: false,
            pc: true
        }, {
            id: 'normalpan-pinchzoom',
            modes: [ComboService.MODES.PINCH_ZOOM, normalPan],
            title: 'Pinch Zoom and Normal pan',
            description: 'drag the timeline back and forth, and use two-finger pinching to zoom in and out.',
            mobile: true,
            pc: false
        }, {
            id: 'normalpan-pinchzoommomentum',
            modes: [ComboService.MODES.PINCH_ZOOM_MOMENTUM, normalPan],
            title: 'Pinch Momentum Zoom and Normal Pan',
            description: 'drag the timeline back and forth, and use two-finger pinching to zoom in and out.',
            mobile: true,
            pc: false
        }, {
            id: 'normalpan-pinchzoompowerfour',
            modes: [ComboService.MODES.PINCH_ZOOM_POWER_FOUR, normalPan],
            title: 'Power of Four Pinch Zoom and Flick Pan',
            description: 'drag the timeline back and forth, and use two-finger pinching to zoom in and out.',
            mobile: true,
            pc: false
        }, {//   wheelpan-brushzoomin-dblclickzoomout
            id: 'wheelpan-brushzoomin-dblclickzoomout',
            modes: vertical ? [ComboService.MODES.BRUSH_ZOOM_Y, ComboService.MODES.WHEEL_PAN_Y, ComboService.MODES.DBLCLICK_ZOOM_OUT] : [ComboService.MODES.BRUSH_ZOOM_X, ComboService.MODES.WHEEL_PAN_X, ComboService.MODES.DBLCLICK_ZOOM_OUT],
            title: 'Brush Zoom, Wheel Pan and Double Click Zoom Out',
            description: 'use the scrollwheel to move back and forth, use brushing to zoom in, and use double click to zoom out.',
            mobile: false,
            pc: true
        }, {
            id: 'pinchpan-brushzoomin-dblclickzoomout',
            modes: vertical ? [ComboService.MODES.BRUSH_ZOOM_Y, ComboService.MODES.PINCH_PAN, ComboService.MODES.DBLCLICK_ZOOM_OUT] : [ComboService.MODES.BRUSH_ZOOM_X, ComboService.MODES.PINCH_PAN, ComboService.MODES.DBLCLICK_ZOOM_OUT],
            title: 'Brush Zoom, Pinch Pan and Double Click Zoom Out',
            description: 'use two fingers to drag the timeline back and forth, use brushing to zoom in, and use double tap to zoom out.',
            mobile: true,
            pc: false
        }, /*{
        id: '',
        modes: [ComboService.MODES.DBLCLICK_ZOOM_IN, ComboService.MODES.SIMPLE_PAN, ComboService.MODES.DBLRIGHTCLICK_ZOOM_OUT],
        title: 'dblclick zoom in, simple pan, dbl right click zoom out',
        description: 'Drag the timeline back and forth, use double click to zoom in, and use double right click to zoom out.',
        mobile: false,
        pc: true
    }, {
        id: '',
        modes: [ComboService.MODES.DBLCLICK_ZOOM_IN, ComboService.MODES.WHEEL_PAN_Y, ComboService.MODES.DBLRIGHTCLICK_ZOOM_OUT],
        title: 'dblclick zoom in, wheel pan, dbl right click zoom out',
        description: 'Use the scrollwheel to move back and forth, use double click to zoom in, and use double right click to zoom out.',
        mobile: false,
        pc: true
    },*/ {
            id: 'normalpan-dblclickzoomin-holdzoomout',
            modes: [ComboService.MODES.DBLCLICK_ZOOM_IN, normalPan, ComboService.MODES.HOLD_ZOOM_OUT],
            title: 'Double Click Zoom In, Normal Pan and Hold Zoom Out',
            description: 'drag the timeline back and forth, use double click to zoom in, and hold to zoom out.',
            mobile: true,
            pc: true
        }, {
            id: 'normalpan-dynamiczoomxnormalpan',
            modes: vertical ? [ComboService.MODES.DYNAMIC_ZOOM_X_NORMAL_PAN, normalPan] : [ComboService.MODES.DYNAMIC_ZOOM_Y_NORMAL_PAN, normalPan],
            title: 'Dynamic Zoom Normal Pan and Normal Pan',
            description: 'drag the timeline back and forth, and pull the timeline ' + secondaryForward + ' to zoom in, or ' + secondaryBackward + ' to zoom out.',
            mobile: true, // Timeline moves, red line (zoom indicator) doesnt move
            pc: true
        }, {
            id: 'normalpan-dynamiczoomxadjustable',
            modes: vertical ? [ComboService.MODES.DYNAMIC_ZOOM_X_ADJUSTABLE, normalPan] : [ComboService.MODES.DYNAMIC_ZOOM_Y_ADJUSTABLE, normalPan],
            title: 'Dynamic Zoom Adjustable and Normal Pan',
            description: 'drag the timeline back and forth, and pull the timeline ' + secondaryForward + ' to zoom in, or ' + secondaryBackward + ' to zoom out.',
            mobile: true,
            pc: true // Timeline doesnt move, red line (zoom indicator) moves
        }, {
            id: 'normalpan-holdzoomin-holdzoomout',
            modes: [ComboService.MODES.HOLD_ZOOM_IN, ComboService.MODES.CLICK_HOLD_ZOOM_OUT, normalPan],
            title: 'Hold to Zoom and Normal Pan',
            description: 'drag the timeline back and forth, hold the timeline to zoom in. To zoom out, double click without releasing on the second click.',
            mobile: true,
            pc: true // can adjust zooming position
        }, /*{
            id: '',
            modes: [ComboService.MODES.RUB_ZOOM_IN_X, ComboService.MODES.RUB_ZOOM_OUT_Y, ComboService.MODES.WHEEL_PAN_Y],
            title: 'Rub Zoom In X, Rub Zoom Out Y, Wheel Pan',
            description: 'Use the scrollwheel to move back and forth, use rub horizontally to zoom in, and rub vertically click to zoom out.',
            mobile: false,
            pc: true
        },*/ {
            id: 'normalpan-rubzoominx-rubzoomouty',
            modes: vertical ? [ComboService.MODES.RUB_ZOOM_IN_X, ComboService.MODES.RUB_ZOOM_OUT_Y, normalPan] : [ComboService.MODES.RUB_ZOOM_IN_Y, ComboService.MODES.RUB_ZOOM_OUT_X, normalPan],
            title: 'Rub zoom in X, Rub Zoom Out Y, Normal Pan',
            description: 'drag the timeline back and forth ' + secondaryAxis + 'ly to zoom in, and drag it back and forth ' + primaryAxis + 'ly to zoom out.',
            mobile: true,
            pc: true
        }];
    }
    
    getCombos(mobileOnly : boolean = false, desktopOnly: boolean = false) : {}[]
    {
        if(!this.combinations || !this.combinations.length)
        {
            console.error('combinations not loaded');
        }
        if(mobileOnly)
        {
            return this.combinations.filter(c => c.mobile);
        }
        if(desktopOnly)
        {
            return this.combinations.filter(c => c.pc);
        }
        return this.combinations;
    }
    
    getCombosRandomOrder(mobileOnly : boolean = false, desktopOnly: boolean = false) : {}[]
    {
        // http://en.wikipedia.org/wiki/Fisher-Yates_shuffle#The_modern_algorithm
        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }
        
        return shuffleArray(this.getCombos(mobileOnly, desktopOnly));
    }
    
    getComboById(id: string)
    {
        if(!this.combinations || !this.combinations.length)
        {
            return console.error('combinations not loaded');
        }
        const matches = this.combinations.filter(c => c.id == id);
        
        if(matches.length === 1)
        {
            return matches[0];
        }
        console.error('could not find combo of id ', id);
        return null;
    }
    
    getModeNamesByComboId(id: string)
    {
        const combo = this.getComboById(id);
        const modeNumbers = combo.modes;
        return modeNumbers.map(number => this.getModeNameByModeNumber(number));
    }
    
    getModeNameByModeNumber(number: number)
    {
        const modeNames = Object.keys(ComboService.MODES);
        const modeNumbers = modeNames.map(key => ComboService.MODES[key]);
        const index = modeNumbers.indexOf(number);
        return modeNames[index];
    }
}
