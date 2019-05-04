import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'filterhighvalues'})
export class FilterHighValuesService implements PipeTransform
{
    transform(values: number[], factorLimit: number = 2): number[]
    {
        if(!values || !values.length) return values;
        
        values.sort((a, b) => a - b);
    
        const lowMiddle = Math.floor((values.length - 1) / 2);
        const highMiddle = Math.ceil((values.length - 1) / 2);
        const median = Math.abs((values[lowMiddle] + values[highMiddle]) / 2);
        
        /*const sum = values.reduce((a, b) => a + b);
        const avg = sum / values.length;*/
        /*const squareDiff = values.map(a => Math.pow(avg - a, 2)).reduce((a, b) => a + b);
        const variance = squareDiff / values.length;*/
        
        //console.log(limits, test);
        
        //const result = values.filter(v => Math.abs(v) <= median * factorLimit && Math.abs(v) >= median / factorLimit);
        const result = values.filter(v => Math.abs(v) <= median * factorLimit);
    
        if(result.length / values.length < 0.75)
        {
            console.error('warning: discarding ' + Math.round(100 - 100 * result.length / values.length) + '% (' + result.length + '/' + values.length + ') of the data with this filter! median: ', median, values);
        }
        
        return result;
    }
}
