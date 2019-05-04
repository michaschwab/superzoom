import { Injectable } from '@angular/core';

@Injectable()
export class BrowserinfoService
{
    constructor()
    {
    
    }
    
    getBrowserNameVersion(): {name: string, version: string}
    {
        // Opera 8.0+
        const ua = navigator.userAgent;
        let tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1]))
        {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
            return {name: 'IE', version: (tem[1] || '')};
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null)
            {
                return tem.slice(1).join(' ').replace('OPR', 'Opera');
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null)
        {
            M.splice(1, 1, tem[1]);
        }
        
        return {name: M[0], version: M[1]};
    }
    
    getAllBrowserData()
    {
        const width = window.innerWidth
            || document.documentElement.clientWidth
            || document.body.clientWidth;
        const height = window.innerHeight
            || document.documentElement.clientHeight
            || document.body.clientHeight;
        let mobile = false;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            mobile = true;
        }
        
        return {
            appVersion: navigator.appVersion,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            vendor: navigator.vendor,
            browser: this.getBrowserNameVersion(),
            domAppendRemovePerMs: this.getDomSpeed(),
            clientWidth: width,
            clientHeight: height,
            mobile: mobile
        };
    }
    
    getDomSpeed(): number
    {
        const addRemoveDiv = () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            document.body.removeChild(el);
        };
    
        const measureSpeed: ((task: () => void, repeats: number) => number) = (task: () => void, repeats: number) =>
        {
            const startTime = Date.now();
            for (let i = 0; i < repeats; i++)
            {
                task();
            }
        
            const duration = Date.now() - startTime;
            return Math.round(repeats / duration);
        };
        
        return measureSpeed(addRemoveDiv, 10000);
    }
    
    isiPhone(): boolean
    {
        return !!navigator.userAgent.match(/iPhone/i);
    }
    
    isTablet(): boolean
    {
        return !!navigator.userAgent.match(/Tablet|iPad/i);
    }
}
