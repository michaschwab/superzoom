import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'stdeverror'})
export class StdeverrorPipe implements PipeTransform
{
    transform(values: number[], args: string[]): number
    {
        if(!values.length) return NaN;
        
        const sum = values.reduce((a, b) => a + b);
        const avg = sum / values.length;
        const squareDiff = values.map(a => Math.pow(avg - a, 2)).reduce((a, b) => a + b);
        const variance = squareDiff / values.length;
        
        return Math.sqrt(variance) / Math.sqrt(values.length);
    }
}
