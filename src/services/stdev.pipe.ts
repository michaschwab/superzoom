import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'stdev'})
export class StdevPipe implements PipeTransform
{
    transform(values: number[], args: string[]): number
    {
        const sum = values.reduce((a, b) => a + b);
        const avg = sum / values.length;
        const squareDiff = values.map(a => Math.pow(avg - a, 2)).reduce((a, b) => a + b);
        const variance = squareDiff / values.length;
        
        return Math.sqrt(variance);
    }
}
