import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'filteroutextremevalues'})
export class FilteroutextremevaluesPipe implements PipeTransform
{
    transform(values: number[], lowerLimit: number, upperLimit: number): number[]
    {
        /*const sum = values.reduce((a, b) => a + b);
        const avg = sum / values.length;*/
        /*const squareDiff = values.map(a => Math.pow(avg - a, 2)).reduce((a, b) => a + b);
        const variance = squareDiff / values.length;*/
        
        //console.log(limits, test);
        
        const result = values.filter(v => v >= lowerLimit && v <= upperLimit);
        
        if(result.length / values.length < 0.75)
        {
            console.error('warning: discarding ' + Math.round(100 - 100 * result.length / values.length) + '% (' + result.length + '/' + values.length + ') of the data with this filter!', lowerLimit, upperLimit, values);
        }
        
        return result;
    }
}
