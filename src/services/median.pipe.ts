import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'median'})
export class MedianPipe implements PipeTransform
{
    transform(values: number[], args: string[]): number
    {
        values.sort((a, b) => a - b);
    
        const lowMiddle = Math.floor((values.length - 1) / 2);
        const highMiddle = Math.ceil((values.length - 1) / 2);
        return (values[lowMiddle] + values[highMiddle]) / 2;
    }
}
